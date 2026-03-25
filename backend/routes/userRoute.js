import express from "express"
import {loginUser, registerUser, getUserProfile, changePassword, listUsers, updateUserActiveStatus} from "../controllers/userController.js"
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router()

userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)
userRouter.get("/profile", authMiddleware, getUserProfile)
userRouter.post("/change-password", authMiddleware, changePassword)
userRouter.get("/list", listUsers)
userRouter.post("/status", updateUserActiveStatus)

export default userRouter;