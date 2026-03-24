import orderModel from "../models/orderModel.js";
import userModel from '../models/userModel.js';
import vnpay from "../config/vnpay.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

//placing user order for frontend
const placeOrder = async (req,res) =>{
    try {
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

//user orders for frontend
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

//listing orders for admin panel
const listOrders = async (req,res)=> {
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// api for updating order status
const updateStatus = async (req,res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
        res.json({success:true,message:"Status Updated"})
    } catch(error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const verifyVnpay = async (req, res) => {
    try {
        const verify = vnpay.verifyReturnUrl(req.query);
        const orderId = req.query.vnp_TxnRef;
        const responseCode = req.query.vnp_ResponseCode;

        if (!verify?.isSuccess || !orderId) {
            return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false`);
        }

        if (responseCode === '00') {
            await orderModel.findByIdAndUpdate(orderId, { payment: true, status: "Order Placed" });
            return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=true&orderId=${orderId}`);
        }

        await orderModel.findByIdAndUpdate(orderId, { payment: false, status: "Payment Failed" });
        return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false&orderId=${orderId}`);
    } catch (error) {
        console.log(error);
        return res.redirect(`${FRONTEND_URL}/verifyVnpay?success=false`);
    }
}

export {placeOrder, userOrders,listOrders,updateStatus, verifyVnpay}