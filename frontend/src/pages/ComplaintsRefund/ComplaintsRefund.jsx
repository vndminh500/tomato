import React from 'react';
import { Link } from 'react-router-dom';
import '../Privacy/Privacy.css';

const ComplaintsRefund = () => {
    return (
        <div className="privacy-policy">
            <h1>Complaints and Refund Policy</h1>
            <p>
                At Potato, we want every order to arrive as expected. This policy explains how to raise a complaint,
                how we investigate issues, and when refunds or other remedies may apply.
            </p>

            <h2>Making a complaint</h2>
            <p>
                If something went wrong with your order, contact us as soon as possible through{' '}
                <Link to="/contact-us">Contact us</Link>, by email at potato@gmail.com, or from your order details in
                <strong> My Orders</strong>. Please include your order number, a short description of the problem, and
                photos if the issue involves missing items, damage, or incorrect food. This helps us resolve your case
                faster.
            </p>

            <h2>What we review</h2>
            <p>
                We consider complaints about late delivery beyond the estimated window, missing or incorrect items,
                quality or temperature issues reported at delivery, and payment or voucher problems tied to a
                confirmed Potato order. We may ask for additional information or check records with our kitchen and
                delivery partners before deciding.
            </p>

            <h2>Refunds and alternatives</h2>
            <p>
                Where we confirm that Potato did not meet our service standards, we may offer a <strong>full or partial
                refund</strong> to your original payment method, or <strong>account credit</strong> toward a future
                order, depending on the situation and your preference where options exist. For minor issues (e.g. one
                side item missing), we may offer a partial refund or credit instead of canceling the whole order.
            </p>

            <h2>Timing</h2>
            <p>
                We aim to acknowledge complaints within <strong>2 business days</strong> and provide a substantive
                response within <strong>7 business days</strong>. Refunds, when approved, are usually processed within
                <strong> 5–10 business days</strong>, depending on your bank or payment provider (e.g. card or VNPay).
            </p>

            <h2>When a refund may not apply</h2>
            <p>
                We may be unable to refund orders that were delivered as described but not reported within a reasonable
                time, or when the issue results from incorrect address or contact details you provided, unavailability
                at delivery after multiple attempts, or misuse of promotions. Fraudulent or abusive claims may be
                declined and may affect account access.
            </p>

            <h2>Cancellations</h2>
            <p>
                If you cancel before the kitchen has started preparing your order, you will typically receive a full
                refund. Once preparation has begun, cancellation may only be possible in limited cases (for example, if
                we cannot complete delivery); any fee or partial charge will follow the terms shown at checkout and in
                your order confirmation.
            </p>

            <h2>Escalation</h2>
            <p>
                If you are not satisfied with our first response, reply to the same thread or mark your message as
                escalation. A senior member of the Potato support team will review your case.
            </p>
        </div>
    );
};

export default ComplaintsRefund;
