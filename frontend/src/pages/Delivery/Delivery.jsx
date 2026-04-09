import React from 'react';
import './Delivery.css';

const Delivery = () => {
    return (
        <div className="delivery-policy">
            <h1>Delivery Policy</h1>
            <p>At Potato, we are committed to providing you with a fast and reliable delivery service. Please read our delivery policy to understand how we process and deliver your orders.</p>

            <h2>Delivery Times</h2>
            <p>Our standard delivery time is 30-45 minutes from the time you place your order. However, delivery times may vary depending on your location, traffic conditions, and the volume of orders we are handling at the moment.</p>

            <h2>Delivery Areas</h2>
            <p>We currently deliver to all areas within the city limits. If you are unsure whether we deliver to your location, please enter your address at checkout to confirm.</p>

            <h2>Delivery Charges</h2>
            <p>We offer free delivery on all orders above $20. For orders below $20, a nominal delivery fee of $3 will be applied.</p>

            <h2>Contactless Delivery</h2>
            <p>To ensure the safety of our customers and delivery partners, we offer a contactless delivery option. If you choose this option, your order will be left at your doorstep, and you will be notified via the app.</p>
        </div>
    );
};

export default Delivery;
