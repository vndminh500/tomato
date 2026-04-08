import React, { useEffect, useRef, useState, useCallback } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, Outlet } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Voucher from './pages/Voucher/Voucher'
import Users from './pages/Users/Users'
import NotFound from './pages/NotFound/NotFound'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import axios from 'axios'
import AdminLogin from './components/Auth/AdminLogin'
import OrderDetails from './pages/OrderDetails/OrderDetails'
import Reviews from './pages/Reviews/Reviews'
import Blog from './pages/Blog/Blog'
import BlogForm from './pages/Blog/BlogForm'
import RevenueHome from './pages/Home/RevenueHome'

const NOTIFICATIONS_STORAGE_KEY = 'admin_order_notifications'
const ADMIN_TOKEN_STORAGE_KEY = 'admin_token'
const ADMIN_USER_STORAGE_KEY = 'admin_user'

const ROLE_PERMISSIONS = {
  admin: ["*"],
  staff: [
    "orders.read_all",
    "orders.update_status",
    "reviews.read",
    "reviews.reply"
  ]
}

const ADMIN_PANEL_ROLES = new Set(["staff", "admin"])

const App = () => {
  const navigate = useNavigate()
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
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
  const seenReviewIdsRef = useRef(new Set())
  const isFirstReviewCheckRef = useRef(true)
  const role = String(user?.role || "").trim().toLowerCase()
  const hasWildcard = role === "admin"
  const permissions = new Set(ROLE_PERMISSIONS[role] || [])
  const hasPermission = (permission) => hasWildcard || permissions.has(permission)
  const canReadOrders = hasPermission("orders.read_all")
  const canReadReviews = hasPermission("reviews.read")
  useEffect(() => {
    isFirstOrderCheckRef.current = true
    seenOrderIdsRef.current = new Set()
    notifiedCancelledOrderIdsRef.current = new Set()
    isFirstReviewCheckRef.current = true
    seenReviewIdsRef.current = new Set()
  }, [token])

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

  useEffect(() => {
    if (!token || !canReadReviews) return
    let isMounted = true

    const pollReviews = async () => {
      try {
        const response = await axios.get(`${url}/api/review/admin/recent-review-ids`, { headers: { token } })
        if (!isMounted || !response.data?.success) return

        const list = response.data.data || []
        const ids = list.map((r) => String(r.id))

        if (isFirstReviewCheckRef.current) {
          ids.forEach((id) => seenReviewIdsRef.current.add(id))
          isFirstReviewCheckRef.current = false
          return
        }

        const newly = list.filter((r) => !seenReviewIdsRef.current.has(String(r.id)))
        if (newly.length > 0) {
          const newNotifications = newly.map((r, i) => ({
            id: `review-${String(r.id)}-${Date.now()}-${i}`,
            type: "review",
            reviewId: String(r.id),
            orderId: String(r.orderId),
            message: "A customer submitted a new review.",
            createdAt: Date.now(),
            isRead: false
          }))
          setNotifications((prev) => [...newNotifications, ...prev].slice(0, 100))
          toast.info(
            newly.length === 1 ? "New customer review received." : `${newly.length} new customer reviews received.`
          )
        }

        ids.forEach((id) => seenReviewIdsRef.current.add(id))
      } catch {
        // Silent fail for background polling.
      }
    }

    pollReviews()
    const reviewPollId = setInterval(pollReviews, 10000)

    return () => {
      isMounted = false
      clearInterval(reviewPollId)
    }
  }, [url, token, canReadReviews])

  const handleLoginSuccess = (newToken, userData) => {
    const normalizedUser = {
      ...userData,
      role: String(userData?.role || "").trim().toLowerCase()
    }
    setToken(newToken)
    setUser(normalizedUser)
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, newToken)
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(normalizedUser))
    if (ADMIN_PANEL_ROLES.has(normalizedUser.role)) {
      navigate(`/${normalizedUser.role}`, { replace: true })
    }
  }

  const handleLogout = () => {
    setToken("")
    setUser(null)
    setNotifications([])
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
    navigate("/", { replace: true })
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

  const isAuthenticatedAdmin = Boolean(token && user && ADMIN_PANEL_ROLES.has(role))

  const RoleLayout = () => {
    const { role: roleInUrl } = useParams()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const normalizedUrlRole = String(roleInUrl || "").toLowerCase()

    useEffect(() => {
      setSidebarOpen(false)
    }, [location.pathname])

    useEffect(() => {
      const onResize = () => {
        if (window.innerWidth > 768) setSidebarOpen(false)
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [])

    useEffect(() => {
      if (typeof window === 'undefined' || window.innerWidth > 768) return
      const prev = document.body.style.overflow
      document.body.style.overflow = sidebarOpen ? 'hidden' : ''
      return () => {
        document.body.style.overflow = prev
      }
    }, [sidebarOpen])

    const toggleSidebar = useCallback(() => {
      setSidebarOpen((open) => !open)
    }, [])

    if (!token || !user) {
      return <Navigate to="/" replace state={{ from: location.pathname }} />
    }
    if (!ADMIN_PANEL_ROLES.has(role)) {
      return <Navigate to="/" replace />
    }
    if (!ADMIN_PANEL_ROLES.has(normalizedUrlRole)) {
      return <Navigate to="/" replace />
    }
    if (normalizedUrlRole !== role) {
      const prefix = `/${roleInUrl}`
      const suffix = location.pathname.startsWith(prefix)
        ? location.pathname.slice(prefix.length) || "/"
        : location.pathname
      const pathSuffix = suffix === "/" ? "" : suffix
      return <Navigate to={`/${role}${pathSuffix}`} replace />
    }

    const basePath = `/${role}`

    return (
      <div className="admin-app">
        <Navbar
          user={user}
          basePath={basePath}
          onLogout={handleLogout}
          unreadOrderCount={unreadOrderCount}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onDeleteNotification={handleDeleteNotification}
          onClearAllNotifications={handleClearAllNotifications}
          onMenuToggle={toggleSidebar}
          menuOpen={sidebarOpen}
        />
        <hr className="admin-app-divider" />
        <div className="app-content">
          <button
            type="button"
            className={`sidebar-backdrop${sidebarOpen ? ' is-visible' : ''}`}
            aria-label="Close navigation menu"
            tabIndex={sidebarOpen ? 0 : -1}
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar
            hasPermission={hasPermission}
            basePath={basePath}
            isOpen={sidebarOpen}
            onNavigate={() => setSidebarOpen(false)}
          />
          <main className="admin-main">
            <Outlet context={{ basePath }} />
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer theme="dark" toastClassName="toast-dark" />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticatedAdmin ? (
              <Navigate to={`/${role}`} replace />
            ) : (
              <AdminLogin url={url} onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/:role" element={<RoleLayout />}>
          <Route index element={<RevenueHome url={url} token={token} canReadOrders={canReadOrders} />} />
          <Route
            path="add"
            element={
              hasPermission("menu.create") ? (
                <Add url={url} token={token} />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="list"
            element={
              hasPermission("menu.delete") ? (
                <List
                  url={url}
                  token={token}
                  canUpdateFood={hasPermission("menu.create")}
                  canDeleteFood={hasPermission("menu.delete")}
                />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="orders"
            element={
              hasPermission("orders.read_all") || hasPermission("orders.update_status") ? (
                <Orders url={url} token={token} canUpdate={hasPermission("orders.update_status")} />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="orders/:orderId"
            element={
              hasPermission("orders.read_all") ? (
                <OrderDetails url={url} token={token} />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="reviews"
            element={
              hasPermission('reviews.read') ? (
                <Reviews
                  url={url}
                  token={token}
                  canReply={hasPermission('reviews.reply')}
                />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="vouchers"
            element={
              hasPermission("promo.read") ? (
                <Voucher
                  url={url}
                  token={token}
                  canCreate={hasPermission("promo.create")}
                  canDelete={hasPermission("promo.delete")}
                />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="users"
            element={
              hasPermission("users.read") ? (
                <Users
                  url={url}
                  token={token}
                  currentUserId={user?._id}
                  canUpdateUserProfile={hasPermission("users.update_profile")}
                  canCreateUser={hasPermission("users.create")}
                  canDeleteUser={hasPermission("users.delete")}
                />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="blog"
            element={
              hasPermission("blog.read_all") ? (
                <Blog
                  url={url}
                  token={token}
                  basePath={`/${role}`}
                  canCreate={hasPermission("blog.create")}
                  canUpdate={hasPermission("blog.update")}
                  canDelete={hasPermission("blog.delete")}
                />
              ) : (
                <Navigate to={`/${role}`} replace />
              )
            }
          />
          <Route
            path="blog/add"
            element={
              hasPermission("blog.create")
                ? <BlogForm url={url} token={token} basePath={`/${role}`} />
                : <Navigate to={`/${role}`} replace />
            }
          />
          <Route
            path="blog/edit/:id"
            element={
              hasPermission("blog.update")
                ? <BlogForm url={url} token={token} basePath={`/${role}`} />
                : <Navigate to={`/${role}`} replace />
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
