import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountPercent: { type: Number, required: true, max: 30 },
    expiryDate: { type: Date, required: true },
    minOrderAmount: { type: Number }
});

const VoucherModel = mongoose.models.voucher || mongoose.model("voucher", voucherSchema);

export default VoucherModel;
