import express from "express"
import {
    loginUser,
    registerUser,
    getUserProfile,
    changePassword,
    listUsers,
    updateUserActiveStatus,
    updateUserRole
} from "../controllers/userController.js"
import authMiddleware from "../middleware/auth.js";
import { requirePermission, requireRole } from "../middleware/authorize.js";

const userRouter = express.Router()

userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)
userRouter.get("/profile", authMiddleware, getUserProfile)
userRouter.post("/change-password", authMiddleware, changePassword)
userRouter.get("/list", authMiddleware, requirePermission("users.read"), listUsers)
userRouter.post("/status", authMiddleware, requirePermission("users.update_status"), updateUserActiveStatus)
userRouter.post(
    "/role",
    authMiddleware,
    requireRole("super_admin"),
    requirePermission("users.update_role"),
    updateUserRole
)

export default userRouter;