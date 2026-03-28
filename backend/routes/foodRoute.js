import express from 'express'
import { addFood , listFood, removeFood } from '../controllers/foodController.js'
import multer from 'multer'
import authMiddleware from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorize.js";

const foodRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename:(req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload = multer({storage:storage});

foodRouter.post(
    "/add",
    authMiddleware,
    requirePermission("menu.create"),
    upload.single("image"),
    addFood
);
foodRouter.get("/list", listFood)
foodRouter.post(
    "/remove",
    authMiddleware,
    requirePermission("menu.delete"),
    removeFood
);




export default foodRouter