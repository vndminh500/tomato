import express from 'express'
import { addFood, listFood, updateFood, removeFood } from '../controllers/foodController.js'
import multer from 'multer'
import authMiddleware from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorize.js";

const foodRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename: (_req, file, cb) => {
        const safe = String(file.originalname || "image").replace(/[^\w.\-]/g, "_");
        return cb(null, `${Date.now()}-${safe}`);
    }
})

const imageMimeOk = (mime) => {
    const m = String(mime || "").toLowerCase();
    if (!m) return false;
    if (m === "image/svg+xml") return false;
    return m.startsWith("image/");
};

const extOk = (name) => {
    const ext = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "");
};

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const mime = String(file.mimetype || "").toLowerCase();
        // Windows / some browsers send PNG as octet-stream; still validate extension
        if (mime === "application/octet-stream" && extOk(file.originalname)) {
            return cb(null, true);
        }
        if (imageMimeOk(file.mimetype) || extOk(file.originalname)) {
            return cb(null, true);
        }
        cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed."));
    },
    limits: { fileSize: 8 * 1024 * 1024 }
});

foodRouter.post(
    "/add",
    authMiddleware,
    requirePermission("menu.create"),
    upload.single("image"),
    addFood
);
foodRouter.get("/list", listFood)
foodRouter.post(
    "/update",
    authMiddleware,
    requirePermission("menu.create"),
    upload.single("image"),
    updateFood
)
foodRouter.post(
    "/remove",
    authMiddleware,
    requirePermission("menu.delete"),
    removeFood
);




export default foodRouter