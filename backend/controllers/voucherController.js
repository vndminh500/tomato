import VoucherModel from '../models/voucherModel.js';

const addVoucher = async (req, res) => {
    const { code, discountPercent, expiryDate, minOrderAmount } = req.body;

    if (!code || !discountPercent || !expiryDate || !minOrderAmount) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (discountPercent > 30) {
        return res.status(400).json({ success: false, message: 'Discount percentage cannot exceed 30%.' });
    }

    const newVoucher = new VoucherModel({
        code,
        discountPercent,
        expiryDate,
        minOrderAmount
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
    const { code, minOrderAmount } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, message: 'Please provide a voucher code.' });
    }

    try {
        const voucher = await VoucherModel.findOne({ code });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found.' });
        }

        if (voucher.expiryDate < new Date()) {
            return res.status(410).json({ success: false, message: 'Voucher has expired.' });
        }

        if (minOrderAmount < voucher.minOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum order amount for this voucher is $${voucher.minOrderAmount}.` });
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
