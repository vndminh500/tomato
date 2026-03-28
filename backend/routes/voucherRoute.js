import express from 'express';
import { addVoucher, listVouchers, validateVoucher, removeVoucher } from '../controllers/voucherController.js';
import authMiddleware from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorize.js";

const voucherRouter = express.Router();

voucherRouter.post('/add', authMiddleware, requirePermission("promo.create"), addVoucher);
voucherRouter.get('/list', authMiddleware, requirePermission("promo.read"), listVouchers);
voucherRouter.post('/validate', validateVoucher);
voucherRouter.post('/remove', authMiddleware, requirePermission("promo.delete"), removeVoucher);

export default voucherRouter;
