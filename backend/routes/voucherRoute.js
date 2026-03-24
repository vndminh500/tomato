import express from 'express';
import { addVoucher, listVouchers, validateVoucher } from '../controllers/voucherController.js';

const voucherRouter = express.Router();

voucherRouter.post('/add', addVoucher);
voucherRouter.get('/list', listVouchers);
voucherRouter.post('/validate', validateVoucher);

export default voucherRouter;
