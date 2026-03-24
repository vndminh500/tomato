import express from 'express';
import { addVoucher, listVouchers, validateVoucher, removeVoucher } from '../controllers/voucherController.js';

const voucherRouter = express.Router();

voucherRouter.post('/add', addVoucher);
voucherRouter.get('/list', listVouchers);
voucherRouter.post('/validate', validateVoucher);
voucherRouter.post('/remove', removeVoucher);

export default voucherRouter;
