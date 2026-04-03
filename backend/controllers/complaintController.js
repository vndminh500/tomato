import crypto from "crypto"
import mongoose from "mongoose"
import complaintModel, { COMPLAINT_TYPES } from "../models/complaintModel.js"
import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"

/** Blocks creating a new complaint while one of these is active for the order. */
const BLOCKING_STATUSES = new Set([
    "in_progress",
    "appeal_pending",
    "open",
    "in_review",
    "need_info"
])

const ADMIN_STATUS_OPTIONS = new Set(["in_progress", "approved", "rejected", "resolved", "appeal_pending"])

const genTicketNumber = () => {
    const part = crypto.randomBytes(3).toString("hex").toUpperCase()
    return `CMP-${Date.now().toString(36).toUpperCase()}-${part}`
}

const imageUrls = (req, filenames = []) =>
    filenames.map((name) => `${req.protocol}://${req.get("host")}/images/complaints/${name}`)

export const createComplaint = async (req, res) => {
    try {
        const userId = String(req.user?.id || req.body?.userId || "")
        const { orderId, type, description, contactPhone, contactEmail } = req.body

        if (!orderId || !type || !description || String(description).trim() === "") {
            return res.json({ success: false, message: "orderId, type and description are required" })
        }

        if (!COMPLAINT_TYPES.includes(type)) {
            return res.json({ success: false, message: "Invalid complaint type" })
        }

        const order = await orderModel.findById(orderId)
        if (!order) {
            return res.json({ success: false, message: "Order not found" })
        }
        if (String(order.userId) !== userId) {
            return res.json({ success: false, message: "This order does not belong to you" })
        }

        const existing = await complaintModel.findOne({
            orderId: String(orderId),
            status: { $in: [...BLOCKING_STATUSES] }
        })
        if (existing) {
            return res.json({
                success: false,
                message: "You already have an open complaint for this order",
                data: { ticketNumber: existing.ticketNumber, _id: existing._id }
            })
        }

        const files = req.files || []
        const images = files.map((f) => f.filename).filter(Boolean)

        let ticketNumber = genTicketNumber()
        for (let i = 0; i < 5; i++) {
            try {
                const doc = await complaintModel.create({
                    ticketNumber,
                    userId,
                    orderId: String(orderId),
                    type,
                    description: String(description).trim(),
                    contactPhone: contactPhone != null ? String(contactPhone).trim() : "",
                    contactEmail: contactEmail != null ? String(contactEmail).trim() : "",
                    images,
                    status: "in_progress"
                })
                return res.json({
                    success: true,
                    message: "Complaint submitted",
                    data: formatComplaintForUser(req, doc)
                })
            } catch (e) {
                if (e?.code === 11000) {
                    ticketNumber = genTicketNumber()
                    continue
                }
                throw e
            }
        }
        return res.json({ success: false, message: "Could not create ticket, try again" })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error creating complaint" })
    }
}

function formatComplaintForUser(req, doc) {
    const o = doc.toObject ? doc.toObject() : doc
    const appeal = o.appeal
    return {
        _id: o._id,
        ticketNumber: o.ticketNumber,
        userId: o.userId,
        orderId: o.orderId,
        type: o.type,
        description: o.description,
        contactPhone: o.contactPhone ?? "",
        contactEmail: o.contactEmail ?? "",
        status: o.status,
        images: imageUrls(req, o.images || []),
        responses: (o.responses || []).map((r) => ({
            message: r.message,
            authorRole: r.authorRole,
            createdAt: r.createdAt
        })),
        appeal: appeal
            ? {
                  message: appeal.message,
                  images: imageUrls(req, appeal.images || []),
                  submittedAt: appeal.submittedAt
              }
            : null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
    }
}

export const submitAppeal = async (req, res) => {
    try {
        const userId = String(req.user?.id || "")
        const { ticketNumber, message } = req.body
        const text = message != null ? String(message).trim() : ""
        if (!ticketNumber || !text) {
            return res.json({ success: false, message: "ticketNumber and message are required" })
        }

        const doc = await complaintModel.findOne({ ticketNumber: String(ticketNumber) })
        if (!doc || String(doc.userId) !== userId) {
            return res.json({ success: false, message: "Complaint not found" })
        }
        if (doc.status !== "rejected") {
            return res.json({ success: false, message: "Appeal is only available after a rejection" })
        }
        if (doc.appeal && doc.appeal.message) {
            return res.json({ success: false, message: "You have already submitted an appeal for this ticket" })
        }

        const files = req.files || []
        const images = files.map((f) => f.filename).filter(Boolean)
        const hasEvidence = images.length > 0
        const detailedReason = text.length >= 40
        if (!hasEvidence && !detailedReason) {
            return res.json({
                success: false,
                message:
                    "Please add a detailed explanation (at least 40 characters) or attach at least one image/video as evidence"
            })
        }

        doc.appeal = {
            message: text,
            images,
            submittedAt: new Date()
        }
        doc.status = "appeal_pending"
        await doc.save()
        res.json({ success: true, data: formatComplaintForUser(req, doc) })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error submitting appeal" })
    }
}

export const listMyComplaints = async (req, res) => {
    try {
        const userId = String(req.user?.id || req.body?.userId || "")
        const list = await complaintModel.find({ userId }).sort({ createdAt: -1 }).lean()
        res.json({
            success: true,
            data: list.map((row) => formatComplaintForUser(req, row))
        })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error" })
    }
}

export const getMyComplaint = async (req, res) => {
    try {
        const userId = String(req.user?.id || req.body?.userId || "")
        const { id } = req.params
        let doc = null
        if (id.startsWith("CMP-")) {
            doc = await complaintModel.findOne({ ticketNumber: id })
        } else if (mongoose.Types.ObjectId.isValid(id)) {
            doc = await complaintModel.findById(id)
        }
        if (!doc || String(doc.userId) !== userId) {
            return res.json({ success: false, message: "Complaint not found" })
        }
        res.json({ success: true, data: formatComplaintForUser(req, doc) })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error" })
    }
}

export const adminListComplaints = async (req, res) => {
    try {
        const list = await complaintModel.find().sort({ createdAt: -1 }).lean()
        const userIds = [...new Set(list.map((c) => c.userId).filter(Boolean))]
        const validUserIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
        const users = await userModel
            .find({ _id: { $in: validUserIds } })
            .select("name email")
            .lean()
        const nameById = Object.fromEntries(users.map((u) => [String(u._id), u.name || ""]))

        const summary = list.map((c) => ({
            _id: c._id,
            ticketNumber: c.ticketNumber,
            orderId: c.orderId,
            userId: c.userId,
            customerName: nameById[String(c.userId)] || "—",
            type: c.type,
            status: c.status,
            contactPhone: c.contactPhone ?? "",
            contactEmail: c.contactEmail ?? "",
            descriptionPreview:
                c.description && c.description.length > 120
                    ? `${c.description.slice(0, 120)}…`
                    : c.description,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            responseCount: (c.responses || []).length
        }))
        res.json({ success: true, data: summary })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error" })
    }
}

export const adminGetComplaint = async (req, res) => {
    try {
        const doc = await complaintModel.findById(req.params.id)
        if (!doc) {
            return res.json({ success: false, message: "Not found" })
        }
        res.json({ success: true, data: formatComplaintForUser(req, doc) })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error" })
    }
}

export const adminUpdateComplaint = async (req, res) => {
    try {
        const { status, adminReply } = req.body
        const doc = await complaintModel.findById(req.params.id)
        if (!doc) {
            return res.json({ success: false, message: "Not found" })
        }

        const nextStatus = status != null ? String(status).trim() : ""
        const replyText = adminReply != null ? String(adminReply).trim() : ""

        if (!nextStatus || !ADMIN_STATUS_OPTIONS.has(nextStatus)) {
            return res.json({ success: false, message: "Invalid status" })
        }

        if (nextStatus === "in_progress" || nextStatus === "appeal_pending") {
            return res.json({
                success: false,
                message: "Choose Approved, Rejected, or Resolved before sending a reply to the customer"
            })
        }

        if (!replyText) {
            return res.json({ success: false, message: "Reply to customer is required" })
        }

        doc.status = nextStatus
        doc.responses.push({
            message: replyText,
            authorRole: req.user?.role === "admin" ? "admin" : "staff",
            createdAt: new Date()
        })

        await doc.save()
        res.json({ success: true, data: formatComplaintForUser(req, doc) })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "Error" })
    }
}
