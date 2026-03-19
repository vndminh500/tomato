import express, { application } from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"




// app config
const app = express()
const port = 4000

// middleware
app.use(express.json())
app.use(cors())

//db connection
connectDB();

//api endpoints
app.use("/api/food",foodRouter)
app.use("/images",express.static('uploads'))
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)

// Kiểm tra xem server có đang hoạt động hay không
app.get("/",(req,res)=> {
    res.send("Kết nối API")
})

// Yêu cầu server bắt đầu lắng nghe các yêu cầu tại cổng đã định nghĩa (4000)
app.listen(port,()=> {
    console.log(`Server đã chạy trên http://localhost:${port}`)
})


//mongodb+srv://tomato_db:142836@cluster0.mlkxfh9.mongodb.net/?appName=Cluster0