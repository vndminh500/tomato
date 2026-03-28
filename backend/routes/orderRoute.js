import express from "express"
import authMiddleware from "../middleware/auth.js"
import { placeOrder, userOrders, listOrders, getOrderById, updateStatus, verifyVnpay, cancelOrder, deleteOrder } from "../controllers/orderController.js"
import { requirePermission } from "../middleware/authorize.js";

const orderRouter = express.Router();

orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.get("/verifyVnpay", verifyVnpay);
orderRouter.get("/vnpay-return", verifyVnpay);
orderRouter.post("/userorders",authMiddleware, userOrders)
orderRouter.post("/cancel",authMiddleware, cancelOrder)
orderRouter.post("/delete",authMiddleware, requirePermission("orders.delete"), deleteOrder)
orderRouter.get("/list",authMiddleware, requirePermission("orders.read_all"), listOrders)
orderRouter.get("/:orderId",authMiddleware, requirePermission("orders.read_all"), getOrderById)
orderRouter.post("/status",authMiddleware, requirePermission("orders.update_status"), updateStatus)

export default orderRouter;