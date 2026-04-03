import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const parseAdminEmails = () =>
    String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

export async function seedAdmin() {
    try {
        const emails = parseAdminEmails();
        const password = process.env.ADMIN_PASSWORD;

        if (!emails.length || !password) {
            console.log(
                "[seed] Bỏ qua tạo admin: thiếu ADMIN_EMAILS (hoặc ADMIN_EMAIL) hoặc ADMIN_PASSWORD trong .env"
            );
            return;
        }

        const defaultName = (process.env.ADMIN_NAME || "Admin").trim() || "Admin";
        const saltRounds = 12;
        const hashed = await bcrypt.hash(password, saltRounds);

        for (const email of emails) {
            const existing = await userModel.findOne({ email });
            if (existing) {
                console.log(`[seed] Admin đã tồn tại — bỏ qua (${email})`);
                continue;
            }

            await userModel.create({
                name: defaultName,
                email,
                password: hashed,
                role: "admin",
                isActive: true
            });
            console.log(`[seed] Đã tạo tài khoản admin: ${email}`);
        }
    } catch (err) {
        console.error("[seed] Lỗi seed admin:", err);
    }
}
