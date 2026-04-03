import foodModel from "../models/foodModel.js";

import fs from 'fs'

const addFood = async (req, res) => {

    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,         
        description: req.body.description, 
        price: req.body.price,        
        category: req.body.category,    
        image: image_filename,
        stock: Number(req.body.stock ?? 20)
    })

    try {
        await food.save();
        res.json({success: true, message: "Food Added"})
    } catch (error) {
        console.log(error)
        res.json({success: false, message: "Error"})
    }
}

const listFood = async (req, res) => {
    try {
        await foodModel.updateMany(
            { stock: { $exists: false } },
            { $set: { stock: 20 } }
        );
 
        const foods = await foodModel.find({});

        res.json({success: true, data: foods})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"})
    }
}

const updateFood = async (req, res) => {
    try {
        const { id, name, description, price, category, stock } = req.body;
        if (!id) {
            return res.json({ success: false, message: "Missing food id" });
        }
        const food = await foodModel.findById(id);
        if (!food) {
            return res.json({ success: false, message: "Food not found" });
        }

        if (typeof name === "string" && name.trim()) {
            food.name = name.trim();
        }
        if (typeof description === "string") {
            food.description = description.trim();
        }
        if (price !== undefined && price !== "" && !Number.isNaN(Number(price))) {
            food.price = Number(price);
        }
        if (typeof category === "string" && category.trim()) {
            food.category = category.trim();
        }
        if (stock !== undefined && stock !== "" && !Number.isNaN(Number(stock))) {
            food.stock = Math.max(0, Number(stock));
        }

        if (req.file?.filename) {
            const oldImage = food.image;
            food.image = req.file.filename;
            fs.unlink(`uploads/${oldImage}`, () => {});
        }

        await food.save();
        res.json({ success: true, message: "Food updated", data: food });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (!food) {
            return res.json({ success: false, message: "Food not found" });
        }

        fs.unlink(`uploads/${food.image}`, () => {});

        await foodModel.findByIdAndDelete(req.body.id);

        res.json({ success: true, message: "Food Removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

export { addFood, listFood, updateFood, removeFood };