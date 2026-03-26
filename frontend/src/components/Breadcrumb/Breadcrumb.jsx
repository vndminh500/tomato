import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumb.css';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';

const routeLabels = {
  cart: 'Cart',
  order: 'Checkout',
  myorders: 'My Orders',
  menu: 'Menu',
  product: 'Product',
  about: 'About',
  'contact-us': 'Contact Us',
  delivery: 'Delivery',
  privacy: 'Privacy Policy',
  'mobile-app': 'Mobile App',
  'thank-you': 'Thank You',
  profile: 'Profile',
  verifyVnpay: 'Verify Payment',
};

const Breadcrumb = () => {
  const location = useLocation();
  const { pathname } = location;
  const { food_list } = useContext(StoreContext);

  if (pathname === '/') {
    return null;
  }

  const parts = pathname.split('/').filter(Boolean);
  let crumbs = [];

  if (parts[0] === 'product' || (parts[0] === 'menu' && parts.length > 1)) {
    const productId = parts[1];
    const product = food_list.find((item) => String(item._id) === String(productId));
    crumbs = [
      {
        path: '/menu',
        isLast: parts.length === 1,
        label: 'Menu',
      },
    ];

    if (productId) {
      crumbs.push({
        path: pathname,
        isLast: true,
        label: product?.name || 'Product Details',
      });
    }
  } else if (parts[0] === 'order') {
    crumbs = [
      {
        path: '/cart',
        isLast: false,
        label: 'Cart',
      },
      {
        path: '/order',
        isLast: true,
        label: 'Checkout',
      },
    ];
  } else if (parts[0] === 'myorders' && parts.length > 1) {
    crumbs = [
      {
        path: '/myorders',
        isLast: false,
        label: 'My Orders',
      },
      {
        path: pathname,
        isLast: true,
        label: `Order #${parts[1].slice(-6)}`,
      },
    ];
  } else {
    crumbs = parts.map((part, index) => {
      const path = `/${parts.slice(0, index + 1).join('/')}`;
      const isLast = index === parts.length - 1;
      const label = routeLabels[part] || decodeURIComponent(part);

      return {
        path,
        isLast,
        label,
      };
    });
  }

  return (
    <nav className='breadcrumb' aria-label='breadcrumb'>
      <Link to='/' aria-label='Home' className='breadcrumb-home-icon'>
        <FontAwesomeIcon icon={faHouse} />
      </Link>
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <span className='breadcrumb-separator'>/</span>
          {crumb.isLast ? (
            <span className='breadcrumb-current'>{crumb.label}</span>
          ) : (
            <Link to={crumb.path}>{crumb.label}</Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
