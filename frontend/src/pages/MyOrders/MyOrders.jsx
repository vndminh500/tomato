import React, { useEffect , useState, useContext } from 'react'
import './MyOrders.css'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {

    const {url,token} = useContext(StoreContext)
    const [data,setData] = useState([]);
    const [orderIdToCancel, setOrderIdToCancel] = useState("");
    const navigate = useNavigate();
    const getStatusClassName = (status) => {
        if (status === "Order Placed") return "status-placed";
        if (status === "Order received") return "status-received";
        if (status === "Food Processing") return "status-processing";
        if (status === "Out for delivery") return "status-delivering";
        if (status === "Delivered") return "status-delivered";
        if (status === "Cancelled") return "status-cancelled";
        return "status-default";
    };

    const canCancelOrder = (status) => {
        return status === "Order Placed";
    };

    const fetchOrders = async () => {
        const response = await axios.post(url + "/api/order/userorders",{},{headers:{token}})
        setData(response.data.data);
    }

    const handleCancelOrder = async (orderId) => {
        try {
            const response = await axios.post(
                url + "/api/order/cancel",
                { orderId },
                { headers: { token } }
            );

            if (response.data.success) {
                toast.success("Order cancellation successful.");
                setOrderIdToCancel("");
                fetchOrders();
            } else {
                toast.error(response.data.message || "Unable to cancel order");
            }
        } catch {
            toast.error("Unable to cancel order");
        }
    };

    useEffect(()=>{
        if (!token) return;

        fetchOrders();
        const intervalId = setInterval(fetchOrders, 5000);

        return () => clearInterval(intervalId);
    },[token])

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order,index)=>{
            return(
                <div
                    key={index}
                    className="my-orders-order"
                    onClick={() => navigate(`/myorders/${order._id}`)}
                >
                    <img src={assets.parcel_icon} alt="" />
                    <p>{order.items.map((item,index)=>{
                        if (index ===order.items.length-1) {
                            return item.name+" x " +item.quantity
                        }
                        else {
                            return item.name+" x " +item.quantity +" , "
                        }
                    })}</p>
                    <p>{order.amount} VNĐ</p>
                    <p>Items: {order.items.length}</p>
                    <p className='my-order-status'>
                        <span className={getStatusClassName(order.status)}>&#x25cf;</span>
                        <b className={getStatusClassName(order.status)}>{order.status}</b>
                    </p>
                    {canCancelOrder(order.status) && (
                        <button
                            className='cancel-order-btn'
                            onClick={(event) => {
                                event.stopPropagation();
                                setOrderIdToCancel(order._id);
                            }}
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
            )
        })}
      </div>
      {orderIdToCancel && (
        <div className='cancel-modal-overlay'>
          <div className='cancel-modal'>
            <h3>Confirm cancellation</h3>
            <p>Are you sure you want to cancel this order?</p>
            <div className='cancel-modal-actions'>
              <button
                type='button'
                className='cancel-modal-btn secondary'
                onClick={() => setOrderIdToCancel("")}
              >
                Cancel
              </button>
              <button
                type='button'
                className='cancel-modal-btn danger'
                onClick={() => handleCancelOrder(orderIdToCancel)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    
    </div>
  )
}

export default MyOrders
