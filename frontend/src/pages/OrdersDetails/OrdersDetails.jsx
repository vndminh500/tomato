import React, { useContext, useEffect, useMemo, useState } from 'react';
import './OrdersDetails.css';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import OrderReviewSection from './OrderReviewSection';

const OrdersDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { token, url } = useContext(StoreContext);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async (silent = false) => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                if (!silent) {
                    setIsLoading(true);
                }
                const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { token } });
                if (response.data?.success) {
                    setOrders(response.data.data || []);
                }
            } finally {
                if (!silent) {
                    setIsLoading(false);
                }
            }
        };

        fetchOrders();
        const intervalId = setInterval(() => fetchOrders(true), 5000);
        return () => clearInterval(intervalId);
    }, [token, url]);

    const order = useMemo(
        () => orders.find((item) => String(item._id) === String(orderId)),
        [orders, orderId]
    );

    if (isLoading) {
        return <div className='order-details'>Loading order details...</div>;
    }

    if (!order) {
        return (
            <div className='order-details order-details-empty'>
                <h2>Order not found</h2>
                <p>This order does not exist or is no longer available.</p>
                <button type='button' onClick={() => navigate('/myorders')}>
                    Back to My Orders
                </button>
            </div>
        );
    }

    const subtotal = Number(order.amount || 0);
    const paymentLabel = order.paymentMethod === 'vnpay' ? 'VNPAY' : 'Cash on Delivery';

    return (
        <div className='order-details'>
            <div className='order-details-header'>
                <h2>Order Details</h2>
            </div>

            <div className='order-details-grid'>
                <div className='order-details-card'>
                    <h3>Status</h3>
                    <p>{order.status}</p>
                </div>
                <div className='order-details-card'>
                    <h3>Payment</h3>
                    <p>{paymentLabel}</p>
                </div>
                <div className='order-details-card'>
                    <h3>Total</h3>
                    <p>{subtotal} VNĐ</p>
                </div>
                <div className='order-details-card'>
                    <h3>Items</h3>
                    <p>{order.items.length}</p>
                </div>
            </div>

            <div className='order-details-section'>
                <h3>Delivery Address</h3>
                <p>
                    {order.address?.firstName} {order.address?.lastName}
                </p>
                <p>{order.address?.street}</p>
                <p>
                    {order.address?.city}
                    {order.address?.district ? ` - ${order.address.district}` : ''}
                </p>
                <p>{order.address?.phone}</p>
            </div>

            <div className='order-details-section'>
                <h3>Ordered Items</h3>
                <ul>
                    {order.items.map((item, index) => (
                        <li key={`${item.name}-${index}`}>
                            <span>{item.name}</span>
                            <span>x{item.quantity}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <OrderReviewSection order={order} token={token} url={url} />
        </div>
    );
};

export default OrdersDetails;
