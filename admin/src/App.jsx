import React, { useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Navigate, Route, Routes } from 'react-router-dom'
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
import AdminLogin from './components/Auth/AdminLogin'
import OrderDetails from './pages/OrderDetails/OrderDetails'

const NOTIFICATIONS_STORAGE_KEY = 'admin_order_notifications'
const ADMIN_TOKEN_STORAGE_KEY = 'admin_token'
const ADMIN_USER_STORAGE_KEY = 'admin_user'

const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  admin: [
    "users.read",
    "users.update_status",
    "orders.read_all",
    "orders.update_status",
    "orders.delete",
    "menu.create",
    "menu.delete",
    "promo.create",
    "promo.read",
    "promo.delete",
    "inventory.read",
    "inventory.update"
  ],
  staff: [
    "orders.read_all",
    "orders.update_status"
  ]
}

const App = () => {
  const url ="http://localhost:4000"
  const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "")
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_USER_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
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
  const role = String(user?.role || "").trim().toLowerCase()
  const hasWildcard = role === "super_admin"
  const permissions = new Set(ROLE_PERMISSIONS[role] || [])
  const hasPermission = (permission) => hasWildcard || permissions.has(permission)
  const canReadOrders = hasPermission("orders.read_all")

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications)
    )
  }, [notifications])

  useEffect(() => {
    if (!token || !canReadOrders) return
    let isMounted = true

    const fetchPlacedOrders = async () => {
      try {
        const response = await axios.get(`${url}/api/order/list`, { headers: { token } })
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
  }, [url, token, canReadOrders])

  const handleLoginSuccess = (newToken, userData) => {
    const normalizedUser = {
      ...userData,
      role: String(userData?.role || "").trim().toLowerCase()
    }
    setToken(newToken)
    setUser(normalizedUser)
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, newToken)
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(normalizedUser))
  }

  const handleLogout = () => {
    setToken("")
    setUser(null)
    setNotifications([])
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
  }

  if (!token || !user) {
    return (
      <>
        <ToastContainer theme="dark" toastClassName="toast-dark" />
        <AdminLogin url={url} onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  if (!["staff", "admin", "super_admin"].includes(role)) {
    return (
      <>
        <ToastContainer theme="dark" toastClassName="toast-dark" />
        <AdminLogin url={url} onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

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
        user={user}
        onLogout={handleLogout}
        unreadOrderCount={unreadOrderCount}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAllNotifications={handleClearAllNotifications}
      />
      <hr />
      <div className="app-content">
        <Sidebar hasPermission={hasPermission} />
        <Routes>
          <Route path="/" element={<div />} />
          <Route
            path="/add"
            element={hasPermission("menu.create") ? <Add url={url} token={token} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/list"
            element={hasPermission("menu.delete") ? <List url={url} token={token} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/orders"
            element={(hasPermission("orders.read_all") || hasPermission("orders.update_status"))
              ? <Orders url={url} token={token} canDelete={hasPermission("orders.delete")} canUpdate={hasPermission("orders.update_status")} />
              : <Navigate to="/" replace />
            }
          />
          <Route
            path="/orders/:orderId"
            element={hasPermission("orders.read_all")
              ? <OrderDetails url={url} token={token} />
              : <Navigate to="/" replace />
            }
          />
          <Route
            path="/storehouse"
            element={hasPermission("inventory.read") ? <Storehouse url={url} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/vouchers"
            element={hasPermission("promo.read") ? <Voucher url={url} token={token} canCreate={hasPermission("promo.create")} canDelete={hasPermission("promo.delete")} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/users"
            element={hasPermission("users.read")
              ? <Users url={url} token={token} canUpdateStatus={hasPermission("users.update_status")} canUpdateRole={hasPermission("users.update_role")} />
              : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
