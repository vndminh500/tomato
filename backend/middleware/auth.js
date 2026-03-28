import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"

const authMiddleware = async (req,res,next) => {
    const {token} = req.headers;
    if (!token) {
        return res.json({success:false,message:"Not authorized login again"})
    }
    try {
        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        //
        if (!req.body) {
            req.body = {}; 
        }
        //

        const user = await userModel
            .findById(token_decode.id)
            .select("isActive role permissions");
        if (!user) {
            return res.json({ success: false, message: "Not authorized login again" });
        }
        if (user.isActive === false) {
            return res.json({ success: false, message: "The account has been deactivated." });
        }

        req.body.userId = token_decode.id;
        req.user = {
            id: token_decode.id,
            role: user.role || "customer",
            permissions: Array.isArray(user.permissions) ? user.permissions : []
        };
        next();
    }catch (error){
        console.log(error);
        res.json({success:false,message:"Error"})    
    }
}

export default authMiddleware;
