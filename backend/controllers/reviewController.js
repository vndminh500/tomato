import orderModel from "../models/orderModel.js"
import orderReviewModel from "../models/orderReviewModel.js"
import foodModel from "../models/foodModel.js"
import userModel from "../models/userModel.js"

export const ALLOWED_QUICK_TAGS = new Set([
    "Hot & fresh food",
    "Fast delivery",
    "Secure packaging",
    "Taste a bit bland",
    "Polite staff / driver",
    "Great value",
    "Would order again",
    "Portion size good",
    "Packaging could be better"
])

const mediaUrls = (req, filenames = []) =>
    filenames.map((name) => `${req.protocol}://${req.get("host")}/images/reviews/${name}`)

function orderContactFromOrder(order) {
    if (!order) return { name: "", phone: "", email: "" }
    const a = order.address || {}
    const name = `${a.firstName || ""} ${a.lastName || ""}`.trim()
    return {
        name,
        phone: String(a.phone || "").trim(),
        email: String(a.email || "").trim()
    }
}

function formatReviewForCustomer(req, doc) {
    const o = doc.toObject ? doc.toObject() : doc
    return {
        _id: o._id,
        orderId: o.orderId,
        overallRating: o.overallRating,
        foodQualityRating: o.foodQualityRating ?? null,
        deliverySpeedRating: o.deliverySpeedRating ?? null,
        staffAttitudeRating: o.staffAttitudeRating ?? null,
        comment: o.comment || "",
        quickTags: o.quickTags || [],
        itemRatings: o.itemRatings || [],
        media: mediaUrls(req, o.media || []),
        isAnonymous: Boolean(o.isAnonymous),
        merchantReply: o.merchantReply
            ? {
                  message: o.merchantReply.message,
                  authorRole: o.merchantReply.authorRole,
                  createdAt: o.merchantReply.createdAt
              }
            : null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
    }
}

async function bumpFoodRatings(itemRatings) {
    for (const row of itemRatings || []) {
        const fid = String(row.foodId || "")
        const r = Number(row.rating)
        if (!fid || r < 1 || r > 5) continue
        await foodModel.findByIdAndUpdate(fid, {
            $inc: { ratingCount: 1, ratingSum: r }
        }).catch(() => {})
    }
}

export const createReview = async (req, res) => {
    try {
        const userId = String(req.user?.id || "")
        const orderId = String(req.body?.orderId || "").trim()
        const overallRating = Number(req.body?.overallRating)
        const comment = String(req.body?.comment || "").trim()
        const isAnonymous = false

        let quickTags = []
        try {
            const raw = req.body?.quickTags
            if (typeof raw === "string") quickTags = JSON.parse(raw || "[]")
            else if (Array.isArray(raw)) quickTags = raw
        } catch {
            quickTags = []
        }
        quickTags = quickTags.filter((t) => ALLOWED_QUICK_TAGS.has(String(t)))

        let itemRatings = []
        try {
            const raw = req.body?.itemRatings
            if (typeof raw === "string") itemRatings = JSON.parse(raw || "[]")
            else if (Array.isArray(raw)) itemRatings = raw
        } catch {
            itemRatings = []
        }
        itemRatings = (itemRatings || [])
            .map((x) => ({
                foodId: String(x?.foodId || x?._id || "").trim(),
                name: String(x?.name || "").slice(0, 200),
                rating: Number(x?.rating)
            }))
            .filter((x) => x.foodId && x.rating >= 1 && x.rating <= 5)

        const opt = (v) => {
            const n = Number(v)
            if (!Number.isFinite(n) || n < 1 || n > 5) return null
            return n
        }
        const foodQualityRating = opt(req.body?.foodQualityRating)
        const deliverySpeedRating = opt(req.body?.deliverySpeedRating)
        const staffAttitudeRating = opt(req.body?.staffAttitudeRating)

        if (!orderId) {
            return res.json({ success: false, message: "orderId is required" })
        }
        if (!Number.isFinite(overallRating) || overallRating < 1 || overallRating > 5) {
            return res.json({ success: false, message: "overallRating must be 1–5" })
        }

        const order = await orderModel.findById(orderId)
        if (!order || String(order.userId) !== userId) {
            return res.json({ success: false, message: "Order not found" })
        }
        if (order.status !== "Delivered") {
            return res.json({
                success: false,
                message: "You can only review orders that have been delivered"
            })
        }

        const existing = await orderReviewModel.findOne({ orderId })
        if (existing) {
            return res.json({ success: false, message: "This order has already been reviewed" })
        }

        const files = req.files || []
        const media = files.map((f) => f.filename).filter(Boolean)

        const doc = await orderReviewModel.create({
            orderId,
            userId,
            overallRating,
            foodQualityRating,
            deliverySpeedRating,
            staffAttitudeRating,
            comment: comment.slice(0, 5000),
            quickTags,
            itemRatings,
            media,
            isAnonymous
        })

        await bumpFoodRatings(itemRatings)

        return res.json({
            success: true,
            message: "Thank you for your review",
            data: formatReviewForCustomer(req, doc)
        })
    } catch (err) {
        console.error(err)
        if (err?.code === 11000) {
            return res.json({ success: false, message: "This order has already been reviewed" })
        }
        return res.json({ success: false, message: "Could not save review" })
    }
}

export const getReviewByOrder = async (req, res) => {
    try {
        const userId = String(req.user?.id || "")
        const { orderId } = req.params
        if (!orderId) {
            return res.json({ success: false, message: "orderId is required" })
        }
        const order = await orderModel.findById(orderId)
        if (!order || String(order.userId) !== userId) {
            return res.json({ success: false, message: "Order not found" })
        }
        const doc = await orderReviewModel.findOne({ orderId: String(orderId) }).lean()
        if (!doc) {
            return res.json({ success: true, data: null })
        }
        return res.json({
            success: true,
            data: formatReviewForCustomer(req, doc)
        })
    } catch (err) {
        console.error(err)
        return res.json({ success: false, message: "Error" })
    }
}

export const adminDeliveredOverview = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query?.limit) || 200, 500)
        const orders = await orderModel
            .find({ status: "Delivered" })
            .sort({ date: -1 })
            .limit(limit)
            .lean()

        const ids = orders.map((o) => String(o._id))
        const reviews = await orderReviewModel.find({ orderId: { $in: ids } }).lean()
        const byOrder = Object.fromEntries(reviews.map((r) => [r.orderId, r]))

        const userIds = [...new Set(orders.map((o) => String(o.userId)).filter(Boolean))]
        const validIds = userIds.filter((id) => /^[a-f\d]{24}$/i.test(id))
        const users = await userModel
            .find({ _id: { $in: validIds } })
            .select("name email")
            .lean()
        const nameById = Object.fromEntries(users.map((u) => [String(u._id), u.name || ""]))

        const rows = orders.map((o) => {
            const rev = byOrder[String(o._id)] || null
            const oc = orderContactFromOrder(o)
            const accountName = nameById[String(o.userId)] || ""
            return {
                order: o,
                review: rev
                    ? {
                          _id: rev._id,
                          orderId: rev.orderId,
                          overallRating: rev.overallRating,
                          commentPreview:
                              rev.comment && rev.comment.length > 100
                                  ? `${rev.comment.slice(0, 100)}…`
                                  : rev.comment || "",
                          hasMerchantReply: Boolean(rev.merchantReply?.message),
                          createdAt: rev.createdAt
                      }
                    : null,
                customerName: accountName || "—",
                orderCustomerName: oc.name || accountName || "—",
                orderCustomerPhone: oc.phone || "—"
            }
        })

        return res.json({ success: true, data: rows })
    } catch (err) {
        console.error(err)
        return res.json({ success: false, message: "Error" })
    }
}

export const adminGetReview = async (req, res) => {
    try {
        const doc = await orderReviewModel.findById(req.params.id)
        if (!doc) {
            return res.json({ success: false, message: "Not found" })
        }
        const order = await orderModel.findById(doc.orderId).lean()
        const user = /^[a-f\d]{24}$/i.test(String(doc.userId))
            ? await userModel.findById(doc.userId).select("name email").lean()
            : null
        const oc = orderContactFromOrder(order)
        const formatted = formatReviewForCustomer(req, doc)
        delete formatted.isAnonymous
        return res.json({
            success: true,
            data: {
                ...formatted,
                order,
                customer: user ? { name: user.name, email: user.email } : null,
                orderCustomerName: oc.name || user?.name || "—",
                orderCustomerPhone: oc.phone || "—",
                orderCustomerEmail: oc.email || user?.email || ""
            }
        })
    } catch (err) {
        console.error(err)
        return res.json({ success: false, message: "Error" })
    }
}

export const adminRecentReviewIds = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query?.limit) || 400, 500)
        const docs = await orderReviewModel
            .find()
            .select("_id orderId createdAt")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()
        return res.json({
            success: true,
            data: docs.map((d) => ({
                id: String(d._id),
                orderId: String(d.orderId),
                createdAt: d.createdAt
            }))
        })
    } catch (err) {
        console.error(err)
        return res.json({ success: false, message: "Error" })
    }
}

export const adminReplyToReview = async (req, res) => {
    try {
        const message = String(req.body?.message || "").trim()
        if (!message) {
            return res.json({ success: false, message: "Reply message is required" })
        }
        const doc = await orderReviewModel.findById(req.params.id)
        if (!doc) {
            return res.json({ success: false, message: "Not found" })
        }
        doc.merchantReply = {
            message: message.slice(0, 4000),
            authorRole: req.user?.role === "admin" ? "admin" : "staff",
            createdAt: new Date()
        }
        await doc.save()
        const payload = formatReviewForCustomer(req, doc)
        delete payload.isAnonymous
        return res.json({
            success: true,
            data: payload
        })
    } catch (err) {
        console.error(err)
        return res.json({ success: false, message: "Error" })
    }
}
