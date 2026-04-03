import "dotenv/config";
import mongoose from "mongoose";
import { seedAdmin } from "./adminSeed.js";

export const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("Thiếu MONGO_URI");
        process.exit(1);
    }
    try {
        await mongoose.connect(uri);
        const dbName = mongoose.connection.db?.databaseName;
        console.log("Đã kết nối với Database");
        if (dbName) {
            console.log(`[db] Tên database trong URI: "${dbName}" (collection user → "users")`);
        }
        await seedAdmin();
    } catch (err) {
        console.error("Lỗi kết nối MongoDB:", err);
        process.exit(1);
    }
};
