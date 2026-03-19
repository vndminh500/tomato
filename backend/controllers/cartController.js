// Import model người dùng để có thể tìm kiếm và cập nhật dữ liệu giỏ hàng của họ
import userModel from "../models/userModel.js"

// --- Chức năng: Thêm sản phẩm vào giỏ hàng ---
const addToCart = async (req, res) => {
    try {
        // Tìm thông tin người dùng trong Database bằng ID gửi lên từ request
        let userData = await userModel.findById(req.body.userId);
        // Lấy dữ liệu giỏ hàng hiện tại của người dùng đó
        let cartData = await userData.cartData;

        // Kiểm tra xem món ăn này (itemId) đã có trong giỏ hàng chưa
        if (!cartData[req.body.itemId]) 
        {
            // Nếu chưa có, thiết lập số lượng là 1
            cartData[req.body.itemId] = 1
        }
        else {
            // Nếu đã có rồi, tăng số lượng hiện tại lên 1
            cartData[req.body.itemId] += 1;
        }

        // Cập nhật lại dữ liệu giỏ hàng mới vào Database cho người dùng này
        await userModel.findByIdAndUpdate(req.body.userId, {cartData});
        // Trả về phản hồi thành công cho Frontend
        res.json({success: true, message: "Added To Cart"});
    } catch (error) {
        // Nếu có lỗi (ví dụ sai ID), in lỗi ra console và báo về cho Frontend
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// --- Chức năng: Xóa/Giảm số lượng sản phẩm khỏi giỏ hàng ---
const removeFromCart = async (req, res) => {
    try {
        // Tìm thông tin người dùng dựa trên ID
        let userData = await userModel.findById(req.body.userId);
        // Lấy dữ liệu giỏ hàng của người dùng
        let cartData = await userData.cartData;

        // Nếu món ăn này đang có trong giỏ (số lượng lớn hơn 0)
        if (cartData[req.body.itemId] > 0)
        {
            // Giảm số lượng đi 1
            cartData[req.body.itemId] -= 1;
        }

        // Cập nhật giỏ hàng mới sau khi giảm vào Database
        await userModel.findByIdAndUpdate(req.body.userId, {cartData});
        res.json({success: true, message: "Removed from cart"})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// --- Chức năng: Lấy toàn bộ dữ liệu giỏ hàng để hiển thị ---
const getCart = async(req, res) => {
    try {
        // Tìm người dùng để lấy thông tin
        let userData = await userModel.findById(req.body.userId);
        // Trích xuất riêng phần cartData (danh sách món và số lượng)
        let cartData = await userData.cartData;
        // Gửi dữ liệu giỏ hàng về cho Frontend để hiển thị lên màn hình
        res.json({success: true, cartData})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// Xuất các hàm này ra để file routes/cartRoute.js có thể sử dụng
export {addToCart, removeFromCart, getCart}