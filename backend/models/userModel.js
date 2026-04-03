import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: {type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    cartData:{type:Object,default:{}},
    isActive: { type: Boolean, default: true },
    role: {
        type: String,
        enum: ["customer", "staff", "admin"],
        default: "customer"
    },
    permissions: {
        type: [String],
        default: []
    }
},{minimize:false})

const userModel = mongoose.models.user || mongoose.model("user",userSchema);
export default userModel;