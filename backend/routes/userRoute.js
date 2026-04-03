import express from "express"
import {
    loginUser,
    registerUser,
    getUserProfile,
    changePassword,
    createUserByAdmin,
    listUsers,
    updateUserActiveStatus,
    updateUserRole,
    updateUserByAdmin,
    deleteUser
} from "../controllers/userController.js"
import authMiddleware from "../middleware/auth.js";
import { requirePermission, requireRole } from "../middleware/authorize.js";

const userRouter = express.Router()

userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)
userRouter.get("/profile", authMiddleware, getUserProfile)
userRouter.post("/change-password", authMiddleware, changePassword)
userRouter.post(
    "/admin-create",
    authMiddleware,
    requireRole("admin"),
    requirePermission("users.create"),
    createUserByAdmin
)
userRouter.get("/list", authMiddleware, requirePermission("users.read"), listUsers)
userRouter.post("/status", authMiddleware, requirePermission("users.update_status"), updateUserActiveStatus)
userRouter.post(
    "/role",
    authMiddleware,
    requireRole("admin"),
    requirePermission("users.update_role"),
    updateUserRole
)
userRouter.post(
    "/admin-update",
    authMiddleware,
    requireRole("admin"),
    requirePermission("users.update_profile"),
    updateUserByAdmin
)
userRouter.post(
    "/delete",
    authMiddleware,
    requireRole("admin"),
    requirePermission("users.delete"),
    deleteUser
)

export default userRouter;