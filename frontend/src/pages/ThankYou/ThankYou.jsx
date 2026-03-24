import React from 'react';
import './ThankYou.css';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
    const navigate = useNavigate();

    const orderId = Math.floor(Math.random() * 1000000);

    return (
        <div className='thank-you'>
            <div className="icon">
                <span>&#10004;</span>
            </div>
            <h1>Thank you for your order!</h1>
            <p>Your order number is: <strong>#{orderId}</strong></p>
            <p>Your order will be delivered within 20-40 minutes. Please have cash ready upon delivery.</p>
            <div className="buttons">
                <button onClick={() => navigate('/')} className="home-btn">Return to homepage</button>
                <button onClick={() => navigate('/myorders')} className="orders-btn">View my order</button>
            </div>
        </div>
    );
};

export default ThankYou;
