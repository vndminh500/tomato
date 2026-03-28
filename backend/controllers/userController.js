import userModel from "../models/userModel.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"

const SUPER_ADMIN_EMAILS = String(process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isBootstrapSuperAdmin = (email = "") =>
    SUPER_ADMIN_EMAILS.includes(String(email).trim().toLowerCase());

const loginUser = async(req,res) => {
    const {email,password} = req.body;
    try {
        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success:false,message:"User doesn't exists"})
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if (!isMatch) {
            return res.json({success:false,message:"Invalid credentials"})
        }

        if (user.isActive === false) {
            return res.json({ success: false, message: "Tài khoản đã bị dừng hoạt động" })
        }

        if (isBootstrapSuperAdmin(user.email) && user.role !== "super_admin") {
            user.role = "super_admin";
            await user.save();
        }

        const token = createToken(user._id);
        res.json({
            success:true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "customer"
            }
        })

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }

}

const createToken = (id) => {
    return jwt.sign({id},process.env.JWT_SECRET)
}


const registerUser = async (req,res) => {
    const {name,password,email} = req.body;
    try {
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success:false,message:"User already exists"})
        }

        if (!validator.isEmail(email)) {
            return res.json({success:false,message:"Please enter a valid email"})
        }

        if (password.length < 8) {
            return res.json({success:false,message:"Please enter a strong password"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new userModel({
            name:name,
            email:email,
            password:hashedPassword,
            role: isBootstrapSuperAdmin(email) ? "super_admin" : "customer"
        })

        const user = await newUser.save()
        const token = createToken(user._id)
        res.json({
            success:true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "customer"
            }
        });

    } catch(error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.body.userId).select("name email");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({
            success: true,
            data: {
                username: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    try {
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.json({ success: false, message: "Please fill all password fields" });
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        if (newPassword !== confirmNewPassword) {
            return res.json({ success: false, message: "Confirm password does not match" });
        }

        const user = await userModel.findById(req.body.userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordMatch) {
            return res.json({ success: false, message: "Old password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await userModel.findByIdAndUpdate(req.body.userId, { password: hashedPassword });

        return res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await userModel.find({}).select("name email isActive role").lean();
        const data = users.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            isActive: u.isActive !== false,
            role: u.role || "customer"
        }));
        return res.json({ success: true, data });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

const updateUserActiveStatus = async (req, res) => {
    const targetUserId = req.body.targetUserId || req.body.userId;
    const { isActive } = req.body;
    try {
        if (!targetUserId || typeof isActive !== "boolean") {
            return res.json({ success: false, message: "Invalid request" });
        }
        const user = await userModel.findByIdAndUpdate(
            targetUserId,
            { isActive },
            { new: true }
        ).select("name email isActive");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        return res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive !== false
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

const updateUserRole = async (req, res) => {
    const targetUserId = req.body.targetUserId || req.body.userId;
    const { role } = req.body;
    const validRoles = ["customer", "staff", "admin", "super_admin"];
    try {
        if (!targetUserId || !validRoles.includes(role)) {
            return res.json({ success: false, message: "Invalid request" });
        }
        const targetUser = await userModel.findById(targetUserId).select("role email");
        if (!targetUser) {
            return res.json({ success: false, message: "User not found" });
        }

        if (isBootstrapSuperAdmin(targetUser.email) && role !== "super_admin") {
            return res.json({
                success: false,
                message: "Cannot change role of bootstrap super_admin account"
            });
        }

        const isDemotingSuperAdmin =
            targetUser.role === "super_admin" && role !== "super_admin";
        if (isDemotingSuperAdmin) {
            const superAdminCount = await userModel.countDocuments({
                role: "super_admin"
            });
            if (superAdminCount <= 1) {
                return res.json({
                    success: false,
                    message: "Cannot demote the last super_admin account"
                });
            }
        }

        const user = await userModel.findByIdAndUpdate(
            targetUserId,
            { role },
            { new: true }
        ).select("name email isActive role");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        return res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive !== false,
                role: user.role || "customer"
            }
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

export {
    loginUser,
    registerUser,
    getUserProfile,
    changePassword,
    listUsers,
    updateUserActiveStatus,
    updateUserRole
}