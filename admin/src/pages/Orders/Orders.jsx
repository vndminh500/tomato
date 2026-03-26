import React from 'react'
import './Orders.css'
import { useState } from 'react'
import {toast} from "react-toastify"
import { useEffect } from 'react'
import axios from "axios"
import {assets} from "../../assets/assets"
import { useSearchParams } from 'react-router-dom'

const Orders = ({url}) => {
  const STATUS_FLOW = [
    "Order Placed",
    "Order received",
    "Food Processing",
    "Out for delivery",
    "Delivered"
  ];
  const DELETE_REASON_BY_STATUS = {
    Delivered: "Delivered",
    Cancelled: "The customer canceled the order"
  };
  const canDeleteOrder = (status) => status === "Delivered" || status === "Cancelled";
  const isStatusOptionDisabled = (currentStatus, optionStatus) => {
    if (optionStatus === "Cancelled") {
      return !(currentStatus === "Order Placed" || currentStatus === "Cancelled");
    }

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const optionIndex = STATUS_FLOW.indexOf(optionStatus);
    if (currentIndex === -1 || optionIndex === -1) return false;

    // Force admin to move step-by-step and never go backward.
    return optionIndex < currentIndex || optionIndex > currentIndex + 1;
  };

  const [order,setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState("")
  const [deletingOrderId, setDeletingOrderId] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [cancelStatusOrderId, setCancelStatusOrderId] = useState("")
  const [cancelStatusReason, setCancelStatusReason] = useState("")
  const [highlightedOrderId, setHighlightedOrderId] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()

  const fetchAllOrders = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }
      const response = await axios.get(url+"/api/order/list");
      if (response.data.success) {
        setOrders(response.data.data);
      }
      else if (!silent) {
        toast.error("Unable to load orders")
      }
    } catch {
      if (!silent) {
        toast.error("Connection error")
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const statusHandler = async (event,orderId) => {
    const nextStatus = event.target.value
    if (nextStatus === "Cancelled") {
      setCancelStatusOrderId(orderId)
      setCancelStatusReason("")
      return
    }

    try {
      setUpdatingOrderId(orderId)
      const response = await axios.post(url + "/api/order/status",{
        orderId,
        status: nextStatus
      })
      if (response.data.success) {
        await fetchAllOrders();
      } else {
        toast.error(response.data.message || "Unable to update order status")
      }
    } catch {
      toast.error("Unable to update order status")
    } finally {
      setUpdatingOrderId("")
    }
  }

  const openDeleteModal = (orderId, status) => {
    setDeletingOrderId(orderId)
    setDeleteReason(DELETE_REASON_BY_STATUS[status] || "")
  }

  const closeDeleteModal = () => {
    setDeletingOrderId("")
  }

  const closeCancelStatusModal = () => {
    setCancelStatusOrderId("")
    setCancelStatusReason("")
  }

  const confirmCancelStatus = async () => {
    if (!cancelStatusOrderId) return
    if (!cancelStatusReason.trim()) {
      toast.error("Please enter cancel reason")
      return
    }
    try {
      setUpdatingOrderId(cancelStatusOrderId)
      const response = await axios.post(url + "/api/order/status", {
        orderId: cancelStatusOrderId,
        status: "Cancelled",
        cancelReason: cancelStatusReason.trim()
      })
      if (response.data.success) {
        toast.success("Order status changed to Cancelled")
        closeCancelStatusModal()
        await fetchAllOrders(true)
      } else {
        toast.error(response.data.message || "Unable to update order status")
      }
    } catch {
      toast.error("Unable to update order status")
    } finally {
      setUpdatingOrderId("")
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrderId) return
    try {
      const response = await axios.post(url + "/api/order/delete", {
        orderId: deletingOrderId,
        deleteReason
      })
      if (response.data.success) {
        toast.success("Order deleted successfully")
        closeDeleteModal()
        await fetchAllOrders(true)
      } else {
        toast.error(response.data.message || "Unable to delete order")
      }
    } catch {
      toast.error("Unable to delete order")
    }
  }

  useEffect(()=>{
    fetchAllOrders();
    const intervalId = setInterval(() => fetchAllOrders(true), 5000);
    return () => clearInterval(intervalId);
  },[])

  useEffect(() => {
    const targetOrderId = searchParams.get('orderId')
    if (!targetOrderId || isLoading || order.length === 0) return

    const targetElement = document.getElementById(`order-${targetOrderId}`)
    if (!targetElement) return

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedOrderId(targetOrderId)

    const timeoutId = setTimeout(() => {
      setHighlightedOrderId("")
      setSearchParams((prevParams) => {
        const nextParams = new URLSearchParams(prevParams)
        nextParams.delete('orderId')
        return nextParams
      }, { replace: true })
    }, 2200)

    return () => clearTimeout(timeoutId)
  }, [order, isLoading, searchParams, setSearchParams])


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
          <div
            key={order._id || index}
            id={`order-${order._id}`}
            className={`order-item ${highlightedOrderId === String(order._id) ? 'order-item-highlight' : ''}`}
          >
            {canDeleteOrder(order.status) && (
              <button
                type='button'
                className='order-delete-trigger'
                aria-label='Delete order'
                onClick={() => openDeleteModal(order._id, order.status)}
              >
                <span>&times;</span>
              </button>
            )}
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
                  order.status === "Cancelled"
                    ? "is-cancelled"
                    : order.status === "Delivered"
                    ? "is-delivered"
                    : order.status === "Order Placed"
                      ? "is-placed"
                    : order.status === "Order received"
                      ? "is-received"
                    : order.status === "Out for delivery"
                      ? "is-delivering"
                      : "is-processing"
                }`}>
                  {order.status}
                </span>
                <select
                  onChange={(event)=>statusHandler(event,order._id)}
                  value={order.status}
                  disabled={updatingOrderId === order._id || order.status === "Cancelled"}
                >
                  <option value="Order Placed" disabled={isStatusOptionDisabled(order.status, "Order Placed")}>Order Placed</option>
                  <option value="Order received" disabled={isStatusOptionDisabled(order.status, "Order received")}>Order received</option>
                  <option value="Food Processing" disabled={isStatusOptionDisabled(order.status, "Food Processing")}>Food Processing</option>
                  <option value="Out for delivery" disabled={isStatusOptionDisabled(order.status, "Out for delivery")}>Out for delivery</option>
                  <option value="Delivered" disabled={isStatusOptionDisabled(order.status, "Delivered")}>Delivered</option>
                  {(order.status === "Order Placed" || order.status === "Cancelled") && (
                    <option value="Cancelled" disabled={isStatusOptionDisabled(order.status, "Cancelled")}>Cancelled</option>
                  )}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
      {deletingOrderId && (
        <div className='order-delete-modal-overlay'>
          <div className='order-delete-modal'>
            <h4>Delete order</h4>
            <p>Please confirm this action. The delete reason is fixed by order status.</p>
            <label>Reason</label>
            <div className='order-delete-reason-fixed'>{deleteReason}</div>
            <div className='order-delete-modal-actions'>
              <button type='button' className='btn-cancel' onClick={closeDeleteModal}>Cancel</button>
              <button type='button' className='btn-delete' onClick={handleDeleteOrder}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {cancelStatusOrderId && (
        <div className='order-delete-modal-overlay'>
          <div className='order-delete-modal'>
            <h4>Confirm cancellation</h4>
            <p>Please enter a reason before setting this order to Cancelled.</p>
            <label htmlFor='cancel-status-reason'>Reason</label>
            <textarea
              id='cancel-status-reason'
              value={cancelStatusReason}
              onChange={(event) => setCancelStatusReason(event.target.value)}
              placeholder='Nhập lý do huỷ đơn...'
              rows={3}
            />
            <div className='order-delete-modal-actions'>
              <button type='button' className='btn-cancel' onClick={closeCancelStatusModal}>Cancel</button>
              <button type='button' className='btn-delete' onClick={confirmCancelStatus}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
