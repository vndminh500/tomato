import express from "express"
import authMiddleware from "../middleware/auth.js"
import { placeOrder, userOrders, listOrders, updateStatus, verifyVnpay, cancelOrder, deleteOrder } from "../controllers/orderController.js"

const orderRouter = express.Router();

orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.get("/verifyVnpay", verifyVnpay);
orderRouter.get("/vnpay-return", verifyVnpay);
orderRouter.post("/userorders",authMiddleware, userOrders)
orderRouter.post("/cancel",authMiddleware, cancelOrder)
orderRouter.post("/delete",deleteOrder)
orderRouter.get("/list",listOrders)
orderRouter.post("/status",updateStatus)

export default orderRouter;