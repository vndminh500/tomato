import VoucherModel from '../models/voucherModel.js';

const calendarYmd = (d) =>
    d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

const addVoucher = async (req, res) => {
    const { code, discountPercent, expiryDate, minOrderAmount } = req.body;

    if (!code || discountPercent === undefined || discountPercent === '' || !expiryDate || minOrderAmount === undefined || minOrderAmount === '') {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const discountNum = Number(discountPercent);
    const minOrderNum = Number(minOrderAmount);
    if (Number.isNaN(discountNum) || Number.isNaN(minOrderNum)) {
        return res.status(400).json({ success: false, message: 'Discount and minimum order must be valid numbers.' });
    }

    if (discountNum > 30) {
        return res.status(400).json({ success: false, message: 'Discount percentage cannot exceed 30%.' });
    }

    const exp = new Date(expiryDate);
    if (Number.isNaN(exp.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid expiry date.' });
    }
    const today = new Date();
    if (calendarYmd(exp) < calendarYmd(today)) {
        return res.status(400).json({ success: false, message: 'Expiry date cannot be before today.' });
    }

    const newVoucher = new VoucherModel({
        code,
        discountPercent: discountNum,
        expiryDate,
        minOrderAmount: minOrderNum
    });

    try {
        await newVoucher.save();
        res.status(201).json({ success: true, message: 'Voucher added successfully.', voucher: newVoucher });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Voucher code already exists.' });
        }
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};


const listVouchers = async (req, res) => {
    try {
        const vouchers = await VoucherModel.find({});
        res.json({ success: true, data: vouchers });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};


const validateVoucher = async (req, res) => {
    const { code, cartSubtotal, minOrderAmount } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Please provide a voucher code.' });
    }

    try {
        const voucher = await VoucherModel.findOne({ code });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found.' });
        }

        const exp = new Date(voucher.expiryDate);
        if (Number.isNaN(exp.getTime())) {
            return res.status(500).json({ success: false, message: 'Invalid voucher expiry in database.' });
        }
        if (calendarYmd(exp) < calendarYmd(new Date())) {
            return res.status(410).json({ success: false, message: 'Voucher has expired.' });
        }

        const rawSubtotal = cartSubtotal !== undefined && cartSubtotal !== null ? cartSubtotal : minOrderAmount;
        const orderSubtotal = Number(rawSubtotal);
        const minRequired = Number(voucher.minOrderAmount);
        if (Number.isNaN(orderSubtotal) || Number.isNaN(minRequired)) {
            return res.status(400).json({ success: false, message: 'Invalid order total or voucher configuration.' });
        }
        if (orderSubtotal < minRequired) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount for this voucher is $${minRequired}. Your cart subtotal is $${orderSubtotal.toFixed(2)}.`
            });
        }

        res.json({ success: true, message: 'Voucher is valid.', voucher });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};


const removeVoucher = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Voucher id is required.' });
        }

        const deletedVoucher = await VoucherModel.findByIdAndDelete(id);
        if (!deletedVoucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found.' });
        }

        return res.json({ success: true, message: 'Voucher removed successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

export { addVoucher, listVouchers, validateVoucher, removeVoucher };
