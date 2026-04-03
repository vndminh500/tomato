import express from "express"
import fs from "fs"
import path from "path"
import multer from "multer"
import authMiddleware from "../middleware/auth.js"
import { requirePermission } from "../middleware/authorize.js"
import {
    createComplaint,
    submitAppeal,
    listMyComplaints,
    getMyComplaint,
    adminListComplaints,
    adminGetComplaint,
    adminUpdateComplaint
} from "../controllers/complaintController.js"

const complaintsDir = path.join(process.cwd(), "uploads", "complaints")
fs.mkdirSync(complaintsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, complaintsDir),
    filename: (_req, file, cb) => {
        const safe = String(file.originalname || "file").replace(/[^\w.\-]/g, "_")
        cb(null, `${Date.now()}-${safe}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, cb) => {
        const ok = /^image\//.test(file.mimetype) || /^video\//.test(file.mimetype)
        cb(null, ok)
    }
})

const complaintRouter = express.Router()

complaintRouter.post("/create", authMiddleware, upload.array("images", 5), createComplaint)
complaintRouter.post("/appeal", authMiddleware, upload.array("images", 5), submitAppeal)
complaintRouter.get("/my", authMiddleware, listMyComplaints)
complaintRouter.get("/detail/:id", authMiddleware, getMyComplaint)

complaintRouter.get("/admin/list", authMiddleware, requirePermission("complaints.read"), adminListComplaints)
complaintRouter.get("/admin/:id", authMiddleware, requirePermission("complaints.read"), adminGetComplaint)
complaintRouter.patch("/admin/:id", authMiddleware, requirePermission("complaints.resolve"), adminUpdateComplaint)

export default complaintRouter
