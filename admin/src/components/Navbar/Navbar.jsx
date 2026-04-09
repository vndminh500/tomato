import React, { useEffect, useRef, useState } from 'react'
import './Navbar.css'
import {assets} from '../../assets/assets'
import { Link } from 'react-router-dom'

const Navbar = ({
  user,
  basePath = '',
  onLogout,
  unreadOrderCount = 0,
  notifications = [],
  onMarkNotificationAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onMenuToggle,
  menuOpen = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="navbar">
      <div className="navbar-start">
        {onMenuToggle ? (
          <button
            type="button"
            className="navbar-menu-btn"
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="navbar-menu-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        ) : null}
        <Link to={basePath || '/'} className="navbar-brand">
          <img src={assets.logo} alt="Potato admin logo" className="logo" />
        </Link>
      </div>
      <div className='navbar-actions'>
        <div className='notification-wrap' ref={dropdownRef}>
        <button
          type='button'
          className='notification-bell'
          onClick={toggleDropdown}
          aria-label='View notifications'
        >
          <span className='notification-bell-icon'>🔔</span>
          {unreadOrderCount > 0 && (
            <span className='notification-badge'>
              {unreadOrderCount > 99 ? '99+' : unreadOrderCount}
            </span>
          )}
        </button>
        {isDropdownOpen && (
          <div className='notification-dropdown'>
            <div className='notification-dropdown-header'>
              <span>Notifications</span>
              {notifications.length > 0 && (
                <button
                  type='button'
                  className='notification-clear-all'
                  onClick={() => onClearAllNotifications && onClearAllNotifications()}
                >
                  Clear all
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className='notification-empty'>No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'is-read' : 'is-unread'}`}
                >
                  <Link
                    to={
                      notification.type === 'review'
                        ? `${basePath}/reviews?reviewId=${notification.reviewId}`
                        : `${basePath}/orders?orderId=${notification.orderId}`
                    }
                    className='notification-item-link'
                    onClick={() => {
                      if (!notification.isRead && onMarkNotificationAsRead) {
                        onMarkNotificationAsRead(notification.id)
                      }
                      setIsDropdownOpen(false)
                    }}
                  >
                    <p>{notification.message}</p>
                  </Link>
                  <button
                    type='button'
                    className='notification-delete'
                    aria-label='Delete notification'
                    onClick={(event) => {
                      event.stopPropagation()
                      if (onDeleteNotification) {
                        onDeleteNotification(notification.id)
                      }
                    }}
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        </div>
        <div className='account-chip'>
          <img src={assets.profile_image} alt="Admin profile" className='profile' />
          <div className='account-meta'>
            <span className='account-label'>Role</span>
            <span className='account-role'>{user?.role || "staff"}</span>
          </div>
        </div>
        <button type='button' className='logout-btn' onClick={onLogout}>Logout</button>
      </div>
    </header>
  )
}

export default Navbar
