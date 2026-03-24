import React, { useContext, useEffect, useRef } from 'react';
import './VerifyVnpay.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-hot-toast';

const VerifyVnpay = () => {
    const [searchParams] = useSearchParams();
    const { clearCart } = useContext(StoreContext);
    const navigate = useNavigate();
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const success = searchParams.get('success') === 'true';

        if (success) {
            clearCart();
            toast.success('Thanh toán VNPay thành công');
            navigate('/myorders', { replace: true });
            return;
        }

        toast.error('Thanh toán VNPay thất bại hoặc đã bị hủy');
        navigate('/order', { replace: true });
    }, [clearCart, navigate, searchParams]);

    return (
        <div className='verify'>
            <div className='spinner'></div>
        </div>
    );
};

export default VerifyVnpay;
