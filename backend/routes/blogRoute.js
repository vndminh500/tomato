import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorize.js";
import {
    addBlog,
    getByIdAdmin,
    getBySlugOrId,
    listAll,
    listPublished,
    removeBlog,
    updateBlog,
    uploadImage
} from "../controllers/blogController.js";

const storage = multer.diskStorage({
    destination: "uploads",
    filename: (_req, file, cb) => {
        cb(null, `blog-${Date.now()}-${String(file.originalname || "file").replace(/[^\w.\-]/g, "_")}`);
    }
});
const upload = multer({ storage });

const blogRouter = express.Router();

blogRouter.get("/list", listPublished);
blogRouter.get("/admin/all", authMiddleware, requirePermission("blog.read_all"), listAll);
blogRouter.get("/admin/post/:id", authMiddleware, requirePermission("blog.read_all"), getByIdAdmin);
blogRouter.post("/upload-image", authMiddleware, requirePermission("blog.create"), upload.single("image"), uploadImage);
blogRouter.post("/add", authMiddleware, requirePermission("blog.create"), upload.single("cover"), addBlog);
blogRouter.post("/update", authMiddleware, requirePermission("blog.update"), upload.single("cover"), updateBlog);
blogRouter.post("/remove", authMiddleware, requirePermission("blog.delete"), removeBlog);
blogRouter.get("/:slugOrId", getBySlugOrId);

export default blogRouter;
