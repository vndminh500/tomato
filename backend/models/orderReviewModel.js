import mongoose from "mongoose"

const itemRatingSchema = new mongoose.Schema(
    {
        foodId: { type: String, required: true },
        name: { type: String, default: "" },
        rating: { type: Number, required: true, min: 1, max: 5 }
    },
    { _id: false }
)

const merchantReplySchema = new mongoose.Schema(
    {
        message: { type: String, required: true },
        authorRole: { type: String, default: "admin" },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
)

const orderReviewSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        overallRating: { type: Number, required: true, min: 1, max: 5 },
        foodQualityRating: { type: Number, min: 1, max: 5, default: null },
        deliverySpeedRating: { type: Number, min: 1, max: 5, default: null },
        staffAttitudeRating: { type: Number, min: 1, max: 5, default: null },
        comment: { type: String, default: "" },
        quickTags: { type: [String], default: [] },
        itemRatings: { type: [itemRatingSchema], default: [] },
        media: { type: [String], default: [] },
        isAnonymous: { type: Boolean, default: false },
        merchantReply: { type: merchantReplySchema, default: undefined }
    },
    { timestamps: true }
)

const orderReviewModel =
    mongoose.models.orderReview || mongoose.model("orderReview", orderReviewSchema)

export default orderReviewModel
