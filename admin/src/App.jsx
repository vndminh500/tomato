import React, { useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Voucher from './pages/Voucher/Voucher'
import Users from './pages/Users/Users'
import NotFound from './pages/NotFound/NotFound'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import axios from 'axios'
import Storehouse from './pages/Storehouse/Storehouse'

const NOTIFICATIONS_STORAGE_KEY = 'admin_order_notifications'

const App = () => {

  const url ="http://localhost:4000"
  const [notifications, setNotifications] = useState(() => {
    try {
      const savedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      if (!savedNotifications) return []
      const parsedNotifications = JSON.parse(savedNotifications)
      return Array.isArray(parsedNotifications) ? parsedNotifications : []
    } catch {
      return []
    }
  })
  const seenOrderIdsRef = useRef(new Set())
  const notifiedCancelledOrderIdsRef = useRef(new Set())
  const isFirstOrderCheckRef = useRef(true)

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications)
    )
  }, [notifications])

  useEffect(() => {
    let isMounted = true

    const fetchPlacedOrders = async () => {
      try {
        const response = await axios.get(`${url}/api/order/list`)
        if (!isMounted || !response.data?.success) return

        const allOrders = response.data.data
        const allOrderIds = allOrders.map((order) => String(order._id))

        const placedOrders = allOrders.filter((order) => {
            if (order.status !== 'Order Placed') return false
            if (order.paymentMethod === 'vnpay') return Boolean(order.payment)
            return true
          })
        const cancelledOrders = allOrders.filter(
          (order) => order.status === 'Cancelled' && order.cancelledBy === 'user'
        )
        const cancelledOrderIds = cancelledOrders.map((order) => String(order._id))

        if (isFirstOrderCheckRef.current) {
          seenOrderIdsRef.current = new Set(allOrderIds)
          notifiedCancelledOrderIdsRef.current = new Set(cancelledOrderIds)
          isFirstOrderCheckRef.current = false
          return
        }

        const newOrders = placedOrders.filter(
          (order) => !seenOrderIdsRef.current.has(String(order._id))
        )
        const newOrderCount = newOrders.length

        if (newOrderCount > 0) {
          const newNotifications = newOrders.map((order) => {
            const customerName = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'A customer'
            return {
              id: `placed-${String(order._id)}-${Date.now()}`,
              orderId: String(order._id),
              message: `${customerName} placed an order`,
              createdAt: Date.now(),
              isRead: false,
            }
          })
          setNotifications((prev) => [...newNotifications, ...prev].slice(0, 100))
          toast.info(
            newOrderCount === 1
              ? 'You have 1 new order.'
              : `You have ${newOrderCount} new orders.`
          )
        }

        const newlyCancelledOrders = cancelledOrders.filter(
          (order) => !notifiedCancelledOrderIdsRef.current.has(String(order._id))
        )

        if (newlyCancelledOrders.length > 0) {
          const cancelledNotifications = newlyCancelledOrders.map((order) => {
            const customerName = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.trim() || 'A customer'
            return {
              id: `cancelled-${String(order._id)}-${Date.now()}`,
              orderId: String(order._id),
              message: `${customerName} cancelled an order`,
              createdAt: Date.now(),
              isRead: false,
            }
          })
          setNotifications((prev) => [...cancelledNotifications, ...prev].slice(0, 100))
          toast.info(
            newlyCancelledOrders.length === 1
              ? 'A customer cancelled 1 order.'
              : `Customers cancelled ${newlyCancelledOrders.length} orders.`
          )
        }

        allOrderIds.forEach((id) => seenOrderIdsRef.current.add(id))
        cancelledOrderIds.forEach((id) => notifiedCancelledOrderIdsRef.current.add(id))
      } catch {
        // Silent fail for background polling.
      }
    }

    fetchPlacedOrders()
    const pollingId = setInterval(fetchPlacedOrders, 10000)

    return () => {
      isMounted = false
      clearInterval(pollingId)
    }
  }, [url])

  const unreadOrderCount = notifications.filter((notification) => !notification.isRead).length

  const handleMarkNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const handleDeleteNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    )
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <div className="admin-app">
      <ToastContainer theme="dark" toastClassName="toast-dark" />
      <Navbar
        unreadOrderCount={unreadOrderCount}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
      />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/add" element={<Add url={url} />} />
          <Route path="/list" element={<List url={url} />} />
          <Route path="/orders" element={<Orders url={url} />} />
          <Route path="/storehouse" element={<Storehouse url={url} />} />
          <Route path="/vouchers" element={<Voucher url={url} />} />
          <Route path="/users" element={<Users url={url} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
