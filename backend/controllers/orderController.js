import orderModel from "../models/orderModel.js";
import userModel from '../models/userModel.js';
import vnpay from "../config/vnpay.js";
import foodModel from "../models/foodModel.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const STATUS_FLOW = [
    "Order Placed",
    "Order received",
    "Food Processing",
    "Out for delivery",
    "Delivered"
];

const placeOrder = async (req,res) =>{
    try {
        const totalQuantityByItemId = new Map();
        for (const item of req.body.items || []) {
            const itemId = item?._id || item?.id || item?.foodId;
            const quantity = Number(item?.quantity || 0);
            if (!itemId || quantity <= 0) continue;
            totalQuantityByItemId.set(
                String(itemId),
                (totalQuantityByItemId.get(String(itemId)) || 0) + quantity
            );
        }

        for (const [itemId, quantity] of totalQuantityByItemId.entries()) {
            const product = await foodModel.findById(itemId);
            if (!product) {
                return res.json({
                    success: false,
                    message: "One or more products are unavailable"
                });
            }
            const availableStock = Number(product.stock ?? 20);
            if (quantity > availableStock) {
                return res.json({
                    success: false,
                    message: `${product.name} has only ${availableStock} in stock`
                });
            }
        }

        const newOrder = new orderModel({
            userId:req.body.userId,
            items:req.body.items,
            amount:req.body.amount,
            address:req.body.address,
            paymentMethod: req.body.paymentMethod
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId,{cartData:{}});

        if (req.body.paymentMethod === "cod") {
            await orderModel.findByIdAndUpdate(newOrder._id, { payment: false, status: "Order Placed" });
            res.json({ success: true, message: "Order placed successfully with Cash on Delivery" });
        }
        else if (req.body.paymentMethod === "vnpay") {
            await orderModel.findByIdAndUpdate(newOrder._id, {
                payment: false,
                status: "Order Placed"
            });
            const orderId = newOrder._id.toString();
            const returnUrl = `${BACKEND_URL}/api/order/vnpay-return`;
            const amount = Math.round(Number(req.body.amount) * 100);
            const ipAddr = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket?.remoteAddress
                || req.ip
                || '127.0.0.1';

            const paymentUrl = vnpay.buildPaymentUrl({
                vnp_Amount: amount,
                vnp_IpAddr: ipAddr,
                vnp_ReturnUrl: returnUrl,
                vnp_TxnRef: orderId,
                vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
                vnp_OrderType: 'other'
            });

            res.json({success:true, vnpayUrl: paymentUrl})
        }
        else {
            res.json({success:false,message:"Unknown payment method"})
        }

    } catch(error){
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({
            userId: req.body.userId,
            $or: [
                { paymentMethod: { $ne: "vnpay" } },
                { payment: true }
            ]
        });
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}   

const listOrders = async (req,res)=> {
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return res.json({ success: false, message: "Order ID is required" });
        }
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }
        return res.json({ success: true, data: order });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
}

const updateStatus = async (req,res) => {
    try {
        const order = await orderModel.findById(req.body.orderId);
        if (!order) {
            return res.json({success:false,message:"Order not found"});
        }

        if (order.status === "Cancelled") {
            return res.json({
                success:false,
                message:"Cancelled orders cannot be updated"
            });
        }

        const nextStatus = req.body.status;
        if (nextStatus === "Cancelled") {
            if (order.status !== "Order Placed") {
                return res.json({
                    success:false,
                    message:"Cancelled can only be selected from Order Placed"
                });
            }
            const cancelReason = String(req.body.cancelReason || "").trim();
            if (!cancelReason) {
                return res.json({
                    success:false,
                    message:"Cancel reason is required"
                });
            }

            await orderModel.findByIdAndUpdate(req.body.orderId,{
                status: nextStatus,
                cancelReason,
                cancelledAt: new Date(),
                cancelledBy: "admin"
            });
        } else {
            const currentIndex = STATUS_FLOW.indexOf(order.status);
            const nextIndex = STATUS_FLOW.indexOf(nextStatus);
            if (currentIndex === -1 || nextIndex === -1) {
                return res.json({
                    success:false,
                    message:"Invalid order status transition"
                });
            }
            if (nextIndex < currentIndex) {
                return res.json({
                    success:false,
                    message:"Cannot move status backward"
                });
            }
            if (nextIndex > currentIndex + 1) {
                return res.json({
                    success:false,
                    message:"Please update status step-by-step"
                });
            }

            if (
                order.paymentMethod === "vnpay" &&
                !order.payment &&
                nextIndex > currentIndex
            ) {
                return res.json({
                    success: false,
                    message: "This order is unpaid (VNPAY). Complete payment before advancing status."
                });
            }

            if (nextStatus === "Order received" && !order.stockDeducted) {
                const totalQuantityByItemId = new Map();

                for (const item of order.items || []) {
                    const itemId = item?._id || item?.id || item?.foodId;
                    const quantity = Number(item?.quantity || 0);
                    if (!itemId || quantity <= 0) continue;
                    totalQuantityByItemId.set(
                        String(itemId),
                        (totalQuantityByItemId.get(String(itemId)) || 0) + quantity
                    );
                }

                const stockChecks = [];
                for (const [itemId, quantity] of totalQuantityByItemId.entries()) {
                    const product = await foodModel.findById(itemId);
                    if (!product) {
                        return res.json({
                            success: false,
                            message: `Product not found for item: ${itemId}`
                        });
                    }

                    const availableStock = Number(product.stock ?? 20);
                    if (availableStock < quantity) {
                        return res.json({
                            success: false,
                            message: `Not enough stock for ${product.name || "a product"}`
                        });
                    }

                    stockChecks.push({
                        itemId,
                        nextStock: availableStock - quantity
                    });
                }

                for (const stockItem of stockChecks) {
                    await foodModel.findByIdAndUpdate(stockItem.itemId, {
                        $set: { stock: stockItem.nextStock }
                    });
                }

                await orderModel.findByIdAndUpdate(req.body.orderId, {
                    status: nextStatus,
                    stockDeducted: true,
                    stockDeductedAt: new Date()
                });
            } else {
                await orderModel.findByIdAndUpdate(req.body.orderId,{status: nextStatus});
            }
        }

        res.json({success:true,message:"Status Updated"})
    } catch(error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const cancelOrder = async (req, res) => {
    try {
        const { orderId, reason = "" } = req.body;
        const userId = req.body.userId;

        if (!orderId) {
            return res.json({ success: false, message: "Order ID is required" });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        if (String(order.userId) !== String(userId)) {
            return res.json({ success: false, message: "You are not allowed to cancel this order" });
        }

        const cancellableStatuses = ["Order Placed"];
        if (!cancellableStatuses.includes(order.status)) {
            return res.json({
                success: false,
                message: "This order can no longer be cancelled"
            });
        }

        await orderModel.findByIdAndUpdate(orderId, {
            status: "Cancelled",
            cancelReason: reason,
            cancelledAt: new Date(),
            cancelledBy: "user"
        });

        return res.json({ success: true, message: "Order cancelled successfully" });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
}

const verifyVnpay = async (req, res) => {
    try {
        const verify = vnpay.verifyReturnUrl(req.query);
        const orderId = req.query.vnp_TxnRef;
        const responseCode = req.query.vnp_ResponseCode;

        if (!orderId) {
            return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false`);
        }

        if (!verify?.isSuccess) {
            await orderModel.findByIdAndUpdate(orderId, { payment: false, status: "Order Placed" });
            return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false&orderId=${orderId}`);
        }

        if (responseCode === '00') {
            await orderModel.findByIdAndUpdate(orderId, { payment: true, status: "Order Placed" });
            return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=true&orderId=${orderId}`);
        }

        await orderModel.findByIdAndUpdate(orderId, { payment: false, status: "Order Placed" });
        return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false&orderId=${orderId}`);
    } catch (error) {
        console.log(error);
        return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false`);
    }
}

export {
    placeOrder,
    userOrders,
    listOrders,
    getOrderById,
    updateStatus,
    verifyVnpay,
    cancelOrder
}