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
        res.json({success:true,token})

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
            password:hashedPassword
        })

        const user = await newUser.save()
        const token = createToken(user._id)
        res.json({success:true,token});

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
        const users = await userModel.find({}).select("name email isActive").lean();
        const data = users.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            isActive: u.isActive !== false
        }));
        return res.json({ success: true, data });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

const updateUserActiveStatus = async (req, res) => {
    const { userId, isActive } = req.body;
    try {
        if (!userId || typeof isActive !== "boolean") {
            return res.json({ success: false, message: "Invalid request" });
        }
        const user = await userModel.findByIdAndUpdate(
            userId,
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

export {loginUser, registerUser, getUserProfile, changePassword, listUsers, updateUserActiveStatus}