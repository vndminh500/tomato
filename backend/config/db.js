import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://tomato_db:142836@cluster0.mlkxfh9.mongodb.net/food-app')
    .then(()=>console.log("Đã kết nối với Database"));

}