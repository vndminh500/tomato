import React, { useState, useContext, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { FaBell, FaShoppingCart, FaUserCircle } from 'react-icons/fa';

const ORDER_STATUS_CACHE_KEY = 'customer_order_status_cache';
const CUSTOMER_NOTIFICATIONS_KEY = 'customer_order_notifications';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState('home');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [filteredFood, setFilteredFood] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [customerNotifications, setCustomerNotifications] = useState(() => {
    try {
      const savedNotifications = localStorage.getItem(CUSTOMER_NOTIFICATIONS_KEY);
      if (!savedNotifications) return [];
      const parsed = JSON.parse(savedNotifications);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [deletingNotificationIds, setDeletingNotificationIds] = useState([]);
  const searchContainerRef = useRef(null);
  const notificationRef = useRef(null);
  const navbarMenuRef = useRef(null);
  const previousOrderStatusRef = useRef({});
  const location = useLocation();
  const isProductDetailPage = location.pathname.startsWith('/menu/');

  const { getTotalCartAmount, token, setToken, food_list, url } = useContext(StoreContext);
  const navigate = useNavigate();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const activeMenu = useMemo(() => {
    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/menu')) return 'menu';
    if (location.pathname.startsWith('/blog')) return 'blog';
    if (location.pathname.startsWith('/mobile-app')) return 'mobile-app';
    if (location.pathname.startsWith('/contact-us')) return 'contact-us';
    return menu;
  }, [location.pathname, menu]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMenu('home');
    navigate({ pathname: '/', hash: '' });
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  useEffect(() => {
    if (debouncedSearchValue) {
      const filtered = food_list.filter((item) =>
        item.name.toLowerCase().includes(debouncedSearchValue.toLowerCase())
      );
      setFilteredFood(filtered);
    } else {
      setFilteredFood([]);
    }
    setActiveIndex(-1); 
  }, [debouncedSearchValue, food_list]);

  const handleSuggestionClick = (id) => {
    setSearchValue('');
    setFilteredFood([]);
    setIsSearchVisible(false);
    navigate(`/menu/${id}`);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(ORDER_STATUS_CACHE_KEY);
    localStorage.removeItem(CUSTOMER_NOTIFICATIONS_KEY);
    previousOrderStatusRef.current = {};
    setCustomerNotifications([]);
    setIsNotificationOpen(false);
    setToken('');
    navigate('/');
  };

  const unreadOrderNotifications = customerNotifications.filter((item) => !item.isRead).length;

  const toggleNotificationDropdown = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const handleNotificationItemClick = (notificationId) => {
    setCustomerNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? { ...item, isRead: true }
          : item
      )
    );
    setIsNotificationOpen(false);
    navigate('/myorders');
  };

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation();
    setDeletingNotificationIds((prev) => [...prev, notificationId]);
    setTimeout(() => {
      setCustomerNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      setDeletingNotificationIds((prev) => prev.filter((id) => id !== notificationId));
    }, 220);
  };

  const handleClearAllNotifications = (event) => {
    event.stopPropagation();
    setCustomerNotifications([]);
    setDeletingNotificationIds([]);
  };

  const handleKeyDown = (e) => {
    if (filteredFood.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex === filteredFood.length - 1 ? 0 : prevIndex + 1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex <= 0 ? filteredFood.length - 1 : prevIndex - 1
        );
      } else if (e.key === 'Enter') {
        if (activeIndex > -1) {
          e.preventDefault();
          handleSuggestionClick(filteredFood[activeIndex]._id);
        }
      }
    }
  };

  const getHighlightedText = (text, highlight) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <b key={i}>{part}</b>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleMouseLeave = () => {
    if (searchValue === '') {
      setIsSearchVisible(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setFilteredFood([]);
        if (searchValue === '') {
          setIsSearchVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchValue]);

  useEffect(() => {
    if (location.pathname === '/') {
      setMenu('home');
    } else if (location.pathname.startsWith('/menu')) {
      setMenu('menu');
    } else if (location.pathname.startsWith('/blog')) {
      setMenu('blog');
    } else if (location.pathname.startsWith('/mobile-app')) {
      setMenu('mobile-app');
    } else if (location.pathname.startsWith('/contact-us')) {
      setMenu('contact-us');
    }
  }, [location.pathname]);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      if (!navbarMenuRef.current) return;
      const activeElement = navbarMenuRef.current.querySelector('a.active');
      if (!activeElement) {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
        opacity: 1
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeMenu]);

  useEffect(() => {
    if (!token) {
      previousOrderStatusRef.current = {};
      setCustomerNotifications([]);
      setIsNotificationOpen(false);
      localStorage.removeItem(ORDER_STATUS_CACHE_KEY);
      localStorage.removeItem(CUSTOMER_NOTIFICATIONS_KEY);
      return;
    }

    try {
      const cachedStatusMap = JSON.parse(localStorage.getItem(ORDER_STATUS_CACHE_KEY) || '{}');
      if (cachedStatusMap && typeof cachedStatusMap === 'object') {
        previousOrderStatusRef.current = cachedStatusMap;
      }
    } catch {
      previousOrderStatusRef.current = {};
    }

    const pollOrderStatus = async () => {
      try {
        const response = await axios.post(
          `${url}/api/order/userorders`,
          {},
          { headers: { token } }
        );
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          return;
        }

        const currentStatusMap = {};
        let changedStatusCount = 0;

        response.data.data.forEach((order) => {
          const orderId = String(order._id);
          currentStatusMap[orderId] = order.status;
          if (
            previousOrderStatusRef.current[orderId] &&
            previousOrderStatusRef.current[orderId] !== order.status
          ) {
            changedStatusCount += 1;
          }
        });

        if (changedStatusCount > 0) {
          const statusChangedNotifications = response.data.data
            .filter((order) =>
              previousOrderStatusRef.current[String(order._id)] &&
              previousOrderStatusRef.current[String(order._id)] !== order.status
            )
            .map((order) => {
              const oldStatus = previousOrderStatusRef.current[String(order._id)];
              const cancellationMessage = `Your order was cancelled: ${order.cancelReason || 'reason not specified'}`;
              const cancelledByCustomer = order.status === "Cancelled" && order.cancelledBy === "user";
              return {
                id: `${order._id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
                orderId: String(order._id),
                message: order.status === "Cancelled" && order.cancelledBy === "admin"
                  ? cancellationMessage
                  : `Order #${String(order._id).slice(-6)}: ${oldStatus} -> ${order.status}`,
                shouldNotify: !cancelledByCustomer,
                isRead: false,
                createdAt: Date.now(),
              };
            });

          const visibleNotifications = statusChangedNotifications.filter((item) => item.shouldNotify);

          if (visibleNotifications.length > 0) {
            setCustomerNotifications((prev) =>
              [...visibleNotifications, ...prev].slice(0, 100)
            );
          }
        }

        previousOrderStatusRef.current = currentStatusMap;
        localStorage.setItem(ORDER_STATUS_CACHE_KEY, JSON.stringify(currentStatusMap));
      } catch {
        // Silent background polling.
      }
    };

    pollOrderStatus();
    const intervalId = setInterval(pollOrderStatus, 5000);
    return () => clearInterval(intervalId);
  }, [token, url]);

  useEffect(() => {
    localStorage.setItem(CUSTOMER_NOTIFICATIONS_KEY, JSON.stringify(customerNotifications));
  }, [customerNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className={`navbar ${isProductDetailPage ? 'navbar-no-underline' : ''}`}>
      <Link to='/' onClick={handleHomeClick}>
        <img src={assets.logo} alt='' className='logo' />
      </Link>
      <ul className='navbar-menu' ref={navbarMenuRef}>
        <Link
          to='/'
          onClick={handleHomeClick}
          className={activeMenu === 'home' ? 'active' : ''}
        >
          Home
        </Link>
        <Link
          to='/menu'
          onClick={() => setMenu('menu')}
          className={activeMenu === 'menu' ? 'active' : ''}
        >
          Menu
        </Link>
        <Link
          to='/blog'
          onClick={() => setMenu('blog')}
          className={activeMenu === 'blog' ? 'active' : ''}
        >
          Blog
        </Link>
        <Link
          to='/mobile-app'
          onClick={() => setMenu('mobile-app')}
          className={activeMenu === 'mobile-app' ? 'active' : ''}
        >
          Mobile app
        </Link>
        <Link
          to='/contact-us'
          onClick={() => setMenu('contact-us')}
          className={activeMenu === 'contact-us' ? 'active' : ''}
        >
          Contact us
        </Link>
        <span
          className='navbar-active-indicator'
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
            opacity: indicatorStyle.opacity
          }}
          aria-hidden='true'
        />
      </ul>

      <div className='navbar-right'>
        <div
          className='search-container'
          ref={searchContainerRef}
          onMouseEnter={() => setIsSearchVisible(true)}
          onMouseLeave={handleMouseLeave}
        >
          <input
            type='text'
            placeholder='Search'
            className={`search-input ${
              isSearchVisible || searchValue ? 'active' : ''
            }`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <img src={assets.search_icon} alt='' className='search-icon' />
          {debouncedSearchValue && (
            <div className='suggestions-list'>
              {filteredFood.length > 0 ? (
                filteredFood.map((item, index) => (
                  <li
                    key={item._id}
                    className={index === activeIndex ? 'active' : ''}
                    onClick={() => handleSuggestionClick(item._id)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <img src={`${url}/images/${item.image}`} alt={item.name} />
                    {getHighlightedText(item.name, searchValue)}
                  </li>
                ))
              ) : (
                <div className='no-suggestions'>No results found</div>
              )}
            </div>
          )}
        </div>
        <div className='navbar-search-icon'>
          <Link to='/cart'>
            <FaShoppingCart className='nav-action-icon' aria-label='Cart' />
          </Link>
          <div className={getTotalCartAmount() === 0 ? '' : 'dot'}></div>
        </div>
        <div
          className='navbar-notification-icon'
          aria-label='Notifications'
          ref={notificationRef}
        >
          <button type='button' className='notification-trigger' onClick={toggleNotificationDropdown}>
            <FaBell className='nav-action-icon' aria-label='Notifications' />
            {token && unreadOrderNotifications > 0 && (
              <span className='notification-count-badge'>
                {unreadOrderNotifications > 99 ? '99+' : unreadOrderNotifications}
              </span>
            )}
          </button>
          {isNotificationOpen && token && (
            <div className='customer-notification-dropdown'>
              <div className='customer-notification-header'>
                <div className='customer-notification-title'>Notifications</div>
                {customerNotifications.length > 0 && (
                  <button
                    type='button'
                    className='customer-notification-clear-all'
                    onClick={handleClearAllNotifications}
                  >
                    Clear all
                  </button>
                )}
              </div>
              {customerNotifications.length === 0 ? (
                <p className='customer-notification-empty'>No notifications yet.</p>
              ) : (
                customerNotifications.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    className={`customer-notification-item ${item.isRead ? 'is-read' : 'is-unread'} ${deletingNotificationIds.includes(item.id) ? 'is-removing' : ''}`}
                    onClick={() => handleNotificationItemClick(item.id)}
                  >
                    <span>{item.message}</span>
                    <span
                      className='customer-notification-delete'
                      onClick={(event) => handleDeleteNotification(event, item.id)}
                    >
                      x
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign in</button>
        ) : (
          <div className='navbar-profile'>
            <FaUserCircle className='nav-action-icon' aria-label='Profile' onClick={() => navigate('/profile')} />
            <ul className='navbar-profile-dropdown'>
              <li onClick={() => navigate('/myorders')}>
                <img src={assets.bag_icon} alt='' />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={() => navigate('/favorites')}>
                <img src={assets.heart_icon} alt='' />
                <p>Favorite</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt='' />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
