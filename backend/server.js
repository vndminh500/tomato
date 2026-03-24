import express, { application } from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import commentRouter from "./routes/commentRoute.js"
import voucherRouter from './routes/voucherRoute.js';





const app = express()
const port = 4000


app.use(express.json())
app.use(cors())


connectDB();


app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/comment",commentRouter)
app.use('/api/voucher', voucherRouter);


app.get("/",(req,res)=> {
    res.send("Kết nối API")
})


app.listen(port,()=> {
    console.log(`Server đã chạy trên http://localhost:${port}`)
})


//mongodb+srv://tomato_db:142836@cluster0.mlkxfh9.mongodb.net/?appName=Cluster0