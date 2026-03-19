// Import model món ăn để thao tác với Database
import foodModel from "../models/foodModel.js";
// Import thư viện 'fs' (File System) của Node.js để quản lý file (dùng để xóa ảnh)
import fs from 'fs'

// --- Chức năng: Thêm món ăn mới ---
const addFood = async (req, res) => {

    // Lấy tên file ảnh vừa được upload thông qua middleware Multer
    let image_filename = `${req.file.filename}`;

    // Tạo một đối tượng món ăn mới dựa trên dữ liệu gửi từ form (req.body)
    const food = new foodModel({
        name: req.body.name,            // Tên món
        description: req.body.description, // Mô tả
        price: req.body.price,          // Giá
        category: req.body.category,    // Loại (Pizza, Salad,...)
        image: image_filename          // Tên file ảnh đã lưu trong thư mục uploads
    })

    try {
        // Lưu món ăn vào Database
        await food.save();
        res.json({success: true, message: "Food Added"})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: "Error"})
    }
}

// --- Chức năng: Lấy danh sách tất cả món ăn ---
const listFood = async (req, res) => {
    try {
        // Tìm tất cả (find với {}) các món ăn có trong Database
        const foods = await foodModel.find({});
        // Gửi danh sách này về cho Frontend hiển thị
        res.json({success: true, data: foods})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// --- Chức năng: Xóa món ăn ---
const removeFood = async (req, res) => {
    try {
        // 1. Tìm thông tin món ăn trong Database dựa trên ID gửi lên để lấy tên file ảnh
        const food = await foodModel.findById(req.body.id);
        
        // 2. Xóa file ảnh vật lý trong thư mục 'uploads' để tránh làm đầy bộ nhớ server
        // fs.unlink sẽ tìm đến đường dẫn uploads/ten_anh.png và xóa nó đi
        fs.unlink(`uploads/${food.image}`, () => {})

        // 3. Sau khi xóa ảnh xong, tiến hành xóa bản ghi dữ liệu trong Database
        await foodModel.findByIdAndDelete(req.body.id);
        
        res.json({success: true, message: "Food Removed"})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

// Xuất các hàm để sử dụng trong routes/foodRoute.js
export {addFood, listFood, removeFood}