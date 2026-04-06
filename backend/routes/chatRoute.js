import express from "express"
import authMiddleware from "../middleware/auth.js"
import { sendChatMessage } from "../controllers/chatController.js"

const chatRouter = express.Router()

chatRouter.post("/message", authMiddleware, sendChatMessage)

export default chatRouter
