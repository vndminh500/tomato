import React, { useState, useEffect } from 'react';
import './Voucher.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const todayInputDateMin = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const Voucher = ({ url }) => {
    const [vouchers, setVouchers] = useState([]);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        code: '',
        discountPercent: '',
        expiryDate: '',
        minOrderAmount: ''
    });

    const fetchVouchers = async () => {
        try {
            const response = await axios.get(`${url}/api/voucher/list`);
            if (response.data.success) {
                setVouchers(response.data.data);
            } else {
                toast.error('Error fetching vouchers');
            }
        } catch (error) {
            toast.error('Error fetching vouchers');
        }
    };

    const handleAddVoucher = async (e) => {
        e.preventDefault();
        const minDate = todayInputDateMin();
        if (!newVoucher.expiryDate || newVoucher.expiryDate < minDate) {
            toast.error('Expiry date cannot be before today.');
            return;
        }
        const discountNum = Number(newVoucher.discountPercent);
        const minOrderNum = Number(newVoucher.minOrderAmount);
        if (Number.isNaN(discountNum) || Number.isNaN(minOrderNum)) {
            toast.error('Discount and minimum order must be valid numbers.');
            return;
        }
        try {
            const response = await axios.post(`${url}/api/voucher/add`, {
                code: newVoucher.code.trim(),
                discountPercent: discountNum,
                expiryDate: newVoucher.expiryDate,
                minOrderAmount: minOrderNum
            });
            if (response.data.success) {
                toast.success('Voucher added successfully');
                setShowAddPopup(false);
                setNewVoucher({
                    code: '',
                    discountPercent: '',
                    expiryDate: '',
                    minOrderAmount: ''
                });
                fetchVouchers();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Error adding voucher');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewVoucher({ ...newVoucher, [name]: value });
    };

    const handleRemoveVoucher = async (voucherId) => {
        try {
            const response = await axios.post(`${url}/api/voucher/remove`, { id: voucherId });
            if (response.data.success) {
                toast.success('Voucher removed successfully');
                fetchVouchers();
            } else {
                toast.error(response.data.message || 'Error removing voucher');
            }
        } catch (error) {
            toast.error('Error removing voucher');
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    return (
        <div className='voucher add flex-col'>
            <div className='voucher-header'>
                <p>All Vouchers List</p>
                <button onClick={() => setShowAddPopup(true)}>Add Voucher</button>
            </div>
            <div className='list-table'>
                <div className='list-table-format title'>
                    <b>Code</b>
                    <b>Discount (%)</b>
                    <b>Date</b>
                    <b>Min Order Amount ($)</b>
                    <b>Remove</b>
                </div>
                {vouchers.map((item, index) => (
                    <div key={index} className='list-table-format'>
                        <p>{item.code}</p>
                        <p>{item.discountPercent}</p>
                        <p>{new Date(item.expiryDate).toLocaleDateString()}</p>
                        <p>{item.minOrderAmount}</p>
                        <p className='remove-voucher-btn' onClick={() => handleRemoveVoucher(item._id)}>X</p>
                    </div>
                ))}
            </div>

            {showAddPopup && (
                <div className='add-voucher-popup'>
                    <form onSubmit={handleAddVoucher} className='add-voucher-form'>
                        <h2>Add New Voucher</h2>
                        <span className='close-btn' onClick={() => setShowAddPopup(false)}>&times;</span>
                        <div className='form-group'>
                            <label htmlFor='code'>Voucher Code</label>
                            <input
                                type='text'
                                id='code'
                                name='code'
                                value={newVoucher.code}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='discountPercent'>Discount Percentage</label>
                            <input
                                type='number'
                                id='discountPercent'
                                name='discountPercent'
                                value={newVoucher.discountPercent}
                                onChange={handleInputChange}
                                required
                                max='30'
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='expiryDate'>Expiry Date</label>
                            <input
                                type='date'
                                id='expiryDate'
                                name='expiryDate'
                                value={newVoucher.expiryDate}
                                onChange={handleInputChange}
                                min={todayInputDateMin()}
                                required
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='minOrderAmount'>Minimum Order Amount</label>
                            <input
                                type='number'
                                id='minOrderAmount'
                                name='minOrderAmount'
                                value={newVoucher.minOrderAmount}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <button type='submit'>Add Voucher</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Voucher;
