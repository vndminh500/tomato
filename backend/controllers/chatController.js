import { GoogleGenerativeAI } from "@google/generative-ai"
import userModel from "../models/userModel.js"
import orderModel from "../models/orderModel.js"
import foodModel from "../models/foodModel.js"

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

const SYSTEM_INSTRUCTION = `You are Potato Care, the in-app assistant for Potato food delivery.

Tone: friendly, concise, professional. Reply in English (if the user writes in another language, you may answer in that language).

FEEDBACK AFTER DELIVERY: This chat cannot submit reviews. For ratings, photos, and comments after an order is **Delivered**, tell the user:
1) Open **My Orders**.
2) Open the **order details** for that delivered order.
3) Use **Review the order** on that page (stars, optional criteria, comment, quick tags, media).

For payment or serious issues, they should use contact/support channels described on the site if any. Never claim you submitted a review for them.

When you can identify an orderId from RECENT ORDERS, include: ${FRONTEND_URL}/myorders/<orderId>

ORDERS: Use only RECENT ORDERS from context—never invent order IDs or statuses.

MENU: Use MENU (FOOD CATALOG) from context for dishes and prices.

Policy hints (not binding): quality issues may be reviewed for partial refund or voucher; payment issues—check payment status on the order; final decisions are made by staff after review.`

function formatHistory(history) {
    if (!Array.isArray(history)) return ""
    return history
        .slice(-12)
        .map((h) => {
            const role = h.role === "assistant" ? "Potato Care" : "Customer"
            return `${role}: ${String(h.content || "").slice(0, 2000)}`
        })
        .join("\n")
}

export const sendChatMessage = async (req, res) => {
    try {
        const userId = String(req.user?.id || "")
        const message = req.body?.message != null ? String(req.body.message).trim() : ""
        const history = Array.isArray(req.body?.history) ? req.body.history : []

        if (!message) {
            return res.json({ success: false, message: "Message is required" })
        }

        const apiKey = (
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            ""
        ).trim()
        if (!apiKey) {
            return res.json({
                success: false,
                message: "Chat service is not configured (missing GEMINI_API_KEY)"
            })
        }

        const [user, orders, foods] = await Promise.all([
            userModel.findById(userId).select("name email role").lean(),
            orderModel
                .find({ userId: String(userId) })
                .sort({ date: -1 })
                .limit(8)
                .lean(),
            foodModel
                .find({})
                .select("name description price category stock")
                .sort({ name: 1 })
                .limit(120)
                .lean()
        ])

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        const orderContext = orders.map((o) => ({
            orderId: String(o._id),
            status: o.status,
            amount: o.amount,
            payment: o.payment,
            paymentMethod: o.paymentMethod,
            date: o.date,
            itemCount: Array.isArray(o.items) ? o.items.length : 0,
            itemNames: Array.isArray(o.items)
                ? o.items.map((it) => it?.name || "").filter(Boolean).slice(0, 15)
                : []
        }))

        const menuContext = foods.map((f) => ({
            name: f.name,
            price: f.price,
            category: f.category,
            description: String(f.description || "").slice(0, 200),
            stock: f.stock
        }))

        const contextBlock = [
            "=== CUSTOMER PROFILE (internal) ===",
            JSON.stringify(
                {
                    name: user.name,
                    email: user.email
                },
                null,
                2
            ),
            "=== REVIEWS (read-only for you) ===",
            `Reviews are submitted only on order details after status Delivered. URL pattern: ${FRONTEND_URL}/myorders/{orderId}`,
            "=== RECENT ORDERS ===",
            JSON.stringify(orderContext, null, 2),
            "=== MENU (FOOD CATALOG) ===",
            JSON.stringify(menuContext, null, 2)
        ].join("\n")

        const historyBlock = formatHistory(history)
        const prompt = [
            contextBlock,
            historyBlock ? `=== PRIOR MESSAGES ===\n${historyBlock}` : "",
            `=== NEW USER MESSAGE ===\n${message.slice(0, 4000)}`
        ]
            .filter(Boolean)
            .join("\n\n")

        const genAI = new GoogleGenerativeAI(apiKey)
        const envModel = (process.env.GEMINI_MODEL || "").trim()
        /** Unversioned ids like gemini-1.5-flash often 404 on v1beta; try stable ids in order. */
        /** Order: env first; then models that may still have free-tier quota if 2.0 is limit:0 */
        const modelCandidates = [...new Set(
            [
                envModel,
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-2.5-flash-lite",
                "gemini-1.5-flash-002"
            ].filter(Boolean)
        )]

        let result
        for (let i = 0; i < modelCandidates.length; i++) {
            const modelName = modelCandidates[i]
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: SYSTEM_INSTRUCTION
                })
                result = await model.generateContent(prompt)
                break
            } catch (e) {
                const errText = String(e?.message || "")
                const is404 =
                    e?.status === 404 ||
                    /is not found|404\s+Not Found|not found for api/i.test(errText)
                const is429 =
                    e?.status === 429 ||
                    /\b429\b|Too Many Requests|RESOURCE_EXHAUSTED|Quota exceeded|QuotaFailure/i.test(
                        errText
                    )
                if (is404 && i < modelCandidates.length - 1) {
                    console.warn(`[chat] Model "${modelName}" unavailable (404), trying next…`)
                    continue
                }
                if (is429 && i < modelCandidates.length - 1) {
                    console.warn(
                        `[chat] Model "${modelName}" quota/rate limit (429), trying next model…`
                    )
                    continue
                }
                throw e
            }
        }

        const reply = String(result?.response?.text?.() || "").trim()

        return res.json({
            success: true,
            reply
        })
    } catch (err) {
        console.error("chatController:", err)
        const clientMessage = geminiErrorToUserMessage(err)
        return res.json({
            success: false,
            message: clientMessage
        })
    }
}

/** Map Google Generative AI errors to a clear message for the chat UI (Vietnamese). */
function geminiErrorToUserMessage(err) {
    const msg = String(err?.message || "")
    const details = Array.isArray(err?.errorDetails) ? err.errorDetails : []
    const reason = details.find((d) => d?.reason)?.reason || ""
    const localized = details.find((d) => d?.message)?.message || ""

    if (
        reason === "API_KEY_INVALID" ||
        /API key expired|API_KEY_INVALID|API key not valid/i.test(msg) ||
        /API key not valid/i.test(localized)
    ) {
        return "Không gọi được Gemini: API key không hợp lệ hoặc đã hết hạn. Hãy tạo key mới tại Google AI Studio (https://aistudio.google.com/apikey), cập nhật GEMINI_API_KEY trong backend/.env và khởi động lại server."
    }
    if (
        err?.status === 429 ||
        /\b429\b|Too Many Requests|RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)
    ) {
        const retryMatch = msg.match(/retry in ([\d.]+)\s*s/i)
        const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1], 10)) : null
        const limitZero = /limit:\s*0\b/i.test(msg)

        let hint =
            " Xem hạn mức: https://ai.google.dev/gemini-api/docs/rate-limits và https://aistudio.google.com (Usage)."
        if (limitZero) {
            hint =
                " Dự án/API của bạn có thể chưa được cấp quota miễn phí cho model đó (Google báo limit: 0). Thử đặt GEMINI_MODEL sang model khác (ví dụ gemini-2.5-flash hoặc gemini-1.5-flash-002), hoặc bật billing cho dự án Google Cloud."
        } else if (retrySec && retrySec > 0 && retrySec < 3600) {
            hint = ` Google gợi ý thử lại sau khoảng ${retrySec} giây.`
        }

        return (
            "Gemini từ chối do hết hạn mức hoặc quá nhiều request (theo phút/ngày hoặc theo từng model)." +
            hint
        )
    }
    if (err?.status === 404 || /not found|not supported for generatecontent/i.test(msg)) {
        return `Model Gemini không khả dụng. Trong backend/.env đặt GEMINI_MODEL=gemini-2.0-flash (hoặc gemini-2.5-flash). Alias gemini-1.5-flash thường không còn trên API. Chi tiết: ${msg.slice(0, 200)}`
    }
    if (/blocked|safety|SAFETY/i.test(msg)) {
        return "Tin nhắn bị chặn bởi bộ lọc an toàn. Hãy diễn đạt lại ngắn gọn, trung tính."
    }
    return `Không lấy được phản hồi từ AI. ${msg ? `(${msg.slice(0, 180)})` : "Thử lại sau."}`
}
