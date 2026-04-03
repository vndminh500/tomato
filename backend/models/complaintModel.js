import mongoose from "mongoose"

const COMPLAINT_TYPES = ["staff_quality", "food_issues", "payment", "other"]

/**
 * Primary workflow: in_progress → (admin) approved | rejected | resolved
 * appeal_pending: customer submitted an appeal after rejected
 * Legacy: open, in_review, need_info
 */
const COMPLAINT_STATUSES = [
    "in_progress",
    "approved",
    "rejected",
    "resolved",
    "appeal_pending",
    "open",
    "in_review",
    "need_info"
]

const responseSchema = new mongoose.Schema(
    {
        message: { type: String, required: true },
        authorRole: { type: String, default: "staff" },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: true }
)

const appealSchema = new mongoose.Schema(
    {
        message: { type: String, required: true },
        images: { type: [String], default: [] },
        submittedAt: { type: Date, default: Date.now }
    },
    { _id: false }
)

const complaintSchema = new mongoose.Schema(
    {
        ticketNumber: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        orderId: { type: String, required: true, index: true },
        type: { type: String, required: true, enum: COMPLAINT_TYPES },
        description: { type: String, required: true },
        images: { type: [String], default: [] },
        contactPhone: { type: String, default: "" },
        contactEmail: { type: String, default: "" },
        status: { type: String, default: "in_progress", enum: COMPLAINT_STATUSES },
        responses: { type: [responseSchema], default: [] },
        appeal: { type: appealSchema, default: undefined }
    },
    { timestamps: true }
)

const complaintModel = mongoose.models.complaint || mongoose.model("complaint", complaintSchema)

export default complaintModel
export { COMPLAINT_TYPES, COMPLAINT_STATUSES }
