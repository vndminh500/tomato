import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"
import authMiddleware from "../middleware/auth.js"
import { requirePermission } from "../middleware/authorize.js"
import {
    createReview,
    getReviewByOrder,
    adminDeliveredOverview,
    adminGetReview,
    adminReplyToReview,
    adminRecentReviewIds
} from "../controllers/reviewController.js"

const reviewsDir = path.join(process.cwd(), "uploads", "reviews")
fs.mkdirSync(reviewsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, reviewsDir),
    filename: (_req, file, cb) => {
        const safe = String(file.originalname || "file").replace(/[^\w.\-]/g, "_")
        cb(null, `${Date.now()}-${safe}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024, files: 6 },
    fileFilter: (_req, file, cb) => {
        const ok = /^image\//.test(file.mimetype) || /^video\//.test(file.mimetype)
        cb(null, ok)
    }
})

const reviewRouter = express.Router()

reviewRouter.post("/create", authMiddleware, upload.array("media", 6), createReview)
reviewRouter.get("/by-order/:orderId", authMiddleware, getReviewByOrder)

reviewRouter.get(
    "/admin/delivered-overview",
    authMiddleware,
    requirePermission("reviews.read"),
    adminDeliveredOverview
)
reviewRouter.get(
    "/admin/recent-review-ids",
    authMiddleware,
    requirePermission("reviews.read"),
    adminRecentReviewIds
)
reviewRouter.get("/admin/:id", authMiddleware, requirePermission("reviews.read"), adminGetReview)
reviewRouter.patch(
    "/admin/:id/reply",
    authMiddleware,
    requirePermission("reviews.reply"),
    adminReplyToReview
)

export default reviewRouter
