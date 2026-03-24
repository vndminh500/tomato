import express from "express";
import { addComment, listComments } from "../controllers/commentController.js";
import authMiddleware from "../middleware/auth.js";

const commentRouter = express.Router();

commentRouter.post("/add", authMiddleware, addComment);
commentRouter.get("/list/:productId", listComments);

export default commentRouter;
