import React, { useState, useEffect } from 'react';
import './Voucher.css';
import axios from 'axios';
import { toast } from 'react-toastify';

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
        try {
            const response = await axios.post(`${url}/api/voucher/add`, newVoucher);
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
                </div>
                {vouchers.map((item, index) => (
                    <div key={index} className='list-table-format'>
                        <p>{item.code}</p>
                        <p>{item.discountPercent}</p>
                        <p>{new Date(item.expiryDate).toLocaleDateString()}</p>
                        <p>{item.minOrderAmount}</p>
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
