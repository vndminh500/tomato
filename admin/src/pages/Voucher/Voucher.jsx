import React, { useState, useEffect } from 'react';
import './Voucher.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const todayInputDateMin = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const Voucher = ({ url, token, canCreate = false, canDelete = false }) => {
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingVoucherId, setRemovingVoucherId] = useState("");
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [newVoucher, setNewVoucher] = useState({
        code: '',
        discountPercent: '',
        expiryDate: '',
        minOrderAmount: ''
    });

    const fetchVouchers = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${url}/api/voucher/list`, {
                headers: { token }
            });
            if (response.data.success) {
                setVouchers(response.data.data);
            } else {
                toast.error('Error fetching vouchers');
            }
        } catch {
            toast.error('Error fetching vouchers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVoucher = async (e) => {
        if (!canCreate) return;
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
            }, {
                headers: { token }
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
        } catch {
            toast.error('Error adding voucher');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewVoucher({ ...newVoucher, [name]: value });
    };

    const handleRemoveVoucher = async (voucherId) => {
        if (!canDelete) return;
        try {
            setRemovingVoucherId(voucherId);
            const response = await axios.post(`${url}/api/voucher/remove`, { id: voucherId }, {
                headers: { token }
            });
            if (response.data.success) {
                toast.success('Voucher removed successfully');
                fetchVouchers();
            } else {
                toast.error(response.data.message || 'Error removing voucher');
            }
        } catch {
            toast.error('Error removing voucher');
        } finally {
            setRemovingVoucherId("");
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    return (
        <div className='voucher flex-col'>
            <div className='voucher-header'>
                <p>All Vouchers List</p>
                {canCreate && (
                    <button onClick={() => setShowAddPopup(true)}>Add Voucher</button>
                )}
            </div>
            <div className='list-table'>
                <div className='list-table-format title'>
                    <b>Code</b>
                    <b>Discount (%)</b>
                    <b>Date</b>
                    <b>Min Order Amount ($)</b>
                    <b>Remove</b>
                </div>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className='list-table-format voucher-skeleton-row'>
                            <span className='voucher-skeleton-line'></span>
                            <span className='voucher-skeleton-line short'></span>
                            <span className='voucher-skeleton-line'></span>
                            <span className='voucher-skeleton-line short'></span>
                            <span className='voucher-skeleton-pill'></span>
                        </div>
                    ))
                ) : vouchers.length === 0 ? (
                    <div className='voucher-empty-state'>
                        <p>No vouchers available.</p>
                        <span>Create a voucher to boost conversions on checkout.</span>
                    </div>
                ) : vouchers.map((item, index) => (
                    <div key={index} className='list-table-format'>
                        <p>{item.code}</p>
                        <p>{item.discountPercent}</p>
                        <p>{new Date(item.expiryDate).toLocaleDateString()}</p>
                        <p>{item.minOrderAmount}</p>
                        {canDelete ? (
                            <button
                                className='remove-voucher-btn'
                                onClick={() => handleRemoveVoucher(item._id)}
                                type='button'
                                disabled={removingVoucherId === item._id}
                            >
                                {removingVoucherId === item._id ? "..." : "X"}
                            </button>
                        ) : (
                            <span>-</span>
                        )}
                    </div>
                ))}
            </div>

            {canCreate && showAddPopup && (
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
