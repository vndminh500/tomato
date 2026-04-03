import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = ({ hasPermission, basePath = '' }) => {
  const prefix = basePath || ''
  const options = [
    { to: `${prefix}/add`, icon: assets.add_icon, label: 'Add Items', allow: hasPermission('menu.create') },
    { to: `${prefix}/list`, icon: assets.list_icon, label: 'List Items', allow: hasPermission('menu.delete') },
    { to: `${prefix}/orders`, icon: assets.order_icon, label: 'Orders', allow: hasPermission('orders.read_all') || hasPermission('orders.update_status') },
    { to: `${prefix}/complaints`, icon: assets.complaint_icon, label: 'Complaints', allow: hasPermission('complaints.read') },
    { to: `${prefix}/users`, icon: assets.users_icon, label: 'List Users', allow: hasPermission('users.read') },
    { to: `${prefix}/vouchers`, icon: assets.voucher_icon, label: 'Vouchers', allow: hasPermission('promo.read') }
  ]

  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        {options
          .filter((item) => item.allow)
          .map((item) => (
            <NavLink key={item.to} to={item.to} className="sidebar-option">
              <img src={item.icon} alt="" />
              <p>{item.label}</p>
            </NavLink>
          ))}
      </div>
    </div>
  )
}

export default Sidebar
