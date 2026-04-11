import "./loadEnv.js"
import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import commentRouter from "./routes/commentRoute.js"
import voucherRouter from './routes/voucherRoute.js';
import complaintRouter from "./routes/complaintRoute.js"
import chatRouter from "./routes/chatRoute.js"
import reviewRouter from "./routes/reviewRoute.js"
import blogRouter from "./routes/blogRoute.js"
import { startDailyStockResetScheduler } from "./utils/stockResetScheduler.js";





const app = express()
const port = 4000


app.use(express.json())
app.use(cors())


connectDB();
startDailyStockResetScheduler();


app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/comment",commentRouter)
app.use('/api/voucher', voucherRouter);
app.use("/api/complaint", complaintRouter);
app.use("/api/chat", chatRouter);
app.use("/api/review", reviewRouter);
app.use("/api/blog", blogRouter);


app.get("/",(req,res)=> {
    res.send("Kết nối API")
})

app.use((err, req, res, next) => {
    if (
        err?.name === "MulterError" ||
        String(err?.message || "").includes("Only image files")
    ) {
        return res.status(400).json({
            success: false,
            message: err.message || "Upload failed"
        });
    }
    next(err)
})

app.listen(port,()=> {
    console.log(`Server đã chạy trên http://localhost:${port}`)
})


//mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/?appName=Cluster0