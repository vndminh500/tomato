import React from 'react'
import './Orders.css'
import { useState } from 'react'
import {toast} from "react-toastify"
import { useEffect } from 'react'
import axios from "axios"
import {assets} from "../../assets/assets"

const Orders = ({url}) => {

  const [order,setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState("")

  const fetchAllOrders = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(url+"/api/order/list");
      if (response.data.success) {
        setOrders(response.data.data);
      }
      else {
        toast.error("Unable to load orders")
      }
    } catch {
      toast.error("Connection error")
    } finally {
      setIsLoading(false)
    }
  }

  const statusHandler = async (event,orderId) => {
    try {
      setUpdatingOrderId(orderId)
      const response = await axios.post(url + "/api/order/status",{
        orderId,
        status:event.target.value
      })
      if (response.data.success) {
        await fetchAllOrders();
      }
    } catch {
      toast.error("Unable to update order status")
    } finally {
      setUpdatingOrderId("")
    }
  }

  useEffect(()=>{
    fetchAllOrders();
  },[])


  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="order-item order-skeleton">
              <span className='order-skeleton-icon'></span>
              <div>
                <span className='order-skeleton-line'></span>
                <span className='order-skeleton-line short'></span>
                <span className='order-skeleton-line'></span>
              </div>
              <span className='order-skeleton-line tiny'></span>
              <span className='order-skeleton-line tiny'></span>
              <span className='order-skeleton-pill'></span>
            </div>
          ))
        ) : order.length === 0 ? (
          <div className='order-empty-state'>
            <p>No orders yet.</p>
            <span>New orders will appear here after checkout.</span>
          </div>
        ) : order.map((order,index)=>(
          <div key={index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className='order-item-food'>
                {order.items.map((item,index)=>{
                  if (index===order.items.length-1) {
                    return item.name + " x " + item.quantity
                  }
                  else {
                    return item.name + " x " + item.quantity + " - "
                  }
                })}
              </p>

              <p className="order-item-name">
                {order.address.firstName + " " + order.address.lastName}
              </p>

              <div className="order-item-address">
                <p><strong>Address: </strong> {order.address.street + " "}</p>
                <p>
                  <strong>City: </strong>
                  {order.address.city}
                  {order.address.district ? ` - ${order.address.district}` : order.address.state ? ` - ${order.address.state}` : ""}
                </p>
              </div>
              <p className="order-item-phone">
                <strong>Phone number: </strong>{order.address.phone}
              </p>
            </div>
            <p>Items: {order.items.length}</p>
            <p>${order.amount}</p>
            {order.paymentMethod === "vnpay" && !order.payment ? (
              <div className="order-failed-box">Payment Failed</div>
            ) : (
              <div className='order-status-control'>
                <span className={`order-status-badge ${
                  order.status === "Delivered"
                    ? "is-delivered"
                    : order.status === "Out for delivery"
                      ? "is-delivering"
                      : "is-processing"
                }`}>
                  {order.status}
                </span>
                <select
                  onChange={(event)=>statusHandler(event,order._id)}
                  value={order.status}
                  disabled={updatingOrderId === order._id}
                >
                  <option value="Food Processing">Food Processing</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders
