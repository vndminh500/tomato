import crypto from "crypto"
import userModel from "../models/userModel.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"

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
            role: "customer"
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

const createUserByAdmin = async (req, res) => {
    const { name, email, role, password, confirmPassword } = req.body;
    const validRoles = ["customer", "staff", "admin"];
    try {
        if (!name?.trim() || !email?.trim() || !validRoles.includes(role)) {
            return res.json({ success: false, message: "Invalid request" });
        }
        if (!validator.isEmail(email.trim())) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        const trimmedEmail = email.trim();
        const exists = await userModel.findOne({ email: trimmedEmail });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const pwdTrim = password != null ? String(password).trim() : "";
        const confirmTrim = confirmPassword != null ? String(confirmPassword).trim() : "";
        let plainToHash;
        let temporaryPassword = null;

        if (pwdTrim.length > 0 || confirmTrim.length > 0) {
            if (!pwdTrim || !confirmTrim) {
                return res.json({
                    success: false,
                    message: "Please fill both password and confirm password"
                });
            }
            if (pwdTrim !== confirmTrim) {
                return res.json({ success: false, message: "Passwords do not match" });
            }
            if (pwdTrim.length < 8) {
                return res.json({
                    success: false,
                    message: "Password must be at least 8 characters"
                });
            }
            plainToHash = pwdTrim;
        } else {
            temporaryPassword = crypto.randomBytes(12).toString("base64url");
            plainToHash = temporaryPassword;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainToHash, salt);

        const newUser = new userModel({
            name: name.trim(),
            email: trimmedEmail,
            password: hashedPassword,
            role,
            isActive: true
        });
        const user = await newUser.save();

        return res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive !== false,
                role: user.role || "customer"
            },
            ...(temporaryPassword ? { temporaryPassword } : { passwordSetByAdmin: true })
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

const listUsers = async (req, res) => {
    try {
        // Không filter — trả về toàn bộ user trong collection `users` của DB đang kết nối (MONGO_URI).
        const users = await userModel.find({}).select("name email isActive role").sort({ email: 1 }).lean();
        const data = users.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            isActive: u.isActive !== false,
            role: u.role || "customer"
        }));
        return res.json({ success: true, data, meta: { total: data.length } });
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
            { returnDocument: "after" }
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
    const validRoles = ["customer", "staff", "admin"];
    try {
        if (!targetUserId || !validRoles.includes(role)) {
            return res.json({ success: false, message: "Invalid request" });
        }
        const targetUser = await userModel.findById(targetUserId).select("role email");
        if (!targetUser) {
            return res.json({ success: false, message: "User not found" });
        }

        const isDemotingAdmin =
            targetUser.role === "admin" && role !== "admin";
        if (isDemotingAdmin) {
            const adminCount = await userModel.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return res.json({
                    success: false,
                    message: "It is not possible to remove the last administrator privileges."
                });
            }
        }

        const user = await userModel.findByIdAndUpdate(
            targetUserId,
            { role },
            { returnDocument: "after" }
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

const updateUserByAdmin = async (req, res) => {
    const { targetUserId, name, email, role, isActive } = req.body;
    const currentUserId = req.body.userId;
    const validRoles = ["customer", "staff", "admin"];
    try {
        if (!targetUserId) {
            return res.json({ success: false, message: "Invalid request" });
        }
        const user = await userModel.findById(targetUserId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (typeof name === "string" && name.trim()) {
            user.name = name.trim();
        }
        if (typeof email === "string") {
            const t = email.trim();
            if (!validator.isEmail(t)) {
                return res.json({ success: false, message: "Please enter a valid email" });
            }
            const dup = await userModel.findOne({
                email: t,
                _id: { $ne: user._id }
            });
            if (dup) {
                return res.json({ success: false, message: "Email already in use" });
            }
            user.email = t;
        }

        if (typeof isActive === "boolean") {
            if (String(user._id) === String(currentUserId) && isActive === false) {
                return res.json({
                    success: false,
                    message: "It is not possible to disable the currently logged-in account."
                });
            }
            user.isActive = isActive;
        }

        if (role !== undefined && role !== null && role !== "") {
            if (!validRoles.includes(role)) {
                return res.json({ success: false, message: "Invalid role" });
            }
            const isDemotingAdmin = user.role === "admin" && role !== "admin";
            if (isDemotingAdmin) {
                const adminCount = await userModel.countDocuments({ role: "admin" });
                if (adminCount <= 1) {
                    return res.json({
                        success: false,
                        message: "It is not possible to remove the last administrator privileges."
                    });
                }
            }
            user.role = role;
        }

        await user.save();
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

const deleteUser = async (req, res) => {
    const targetUserId = req.body.targetUserId;
    const currentUserId = req.body.userId;
    try {
        if (!targetUserId) {
            return res.json({ success: false, message: "Missing targetUserId" });
        }
        if (String(targetUserId) === String(currentUserId)) {
            return res.json({
                success: false,
                message: "It is not possible to delete the currently logged-in account."
            });
        }
        const target = await userModel.findById(targetUserId).select("role");
        if (!target) {
            return res.json({ success: false, message: "User not found" });
        }
        if (target.role === "admin") {
            const adminCount = await userModel.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return res.json({
                    success: false,
                    message: "Cannot remove the last admin"
                });
            }
        }
        await userModel.findByIdAndDelete(targetUserId);
        return res.json({ success: true, message: "User deleted" });
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
    createUserByAdmin,
    listUsers,
    updateUserActiveStatus,
    updateUserRole,
    updateUserByAdmin,
    deleteUser
}
