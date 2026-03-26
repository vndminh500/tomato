import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/add' className="sidebar-option">
            <img src={assets.add_icon} alt="" />
            <p>Add Items</p>
        </NavLink>
        
        <NavLink to='/list' className="sidebar-option">
            <img src={assets.list_icon} alt="" />
            <p>List Items</p>
        </NavLink>
        
        <NavLink to='/orders' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Orders</p>
        </NavLink>
        <NavLink to='/storehouse' className="sidebar-option">
            <img src={assets.storehouse_icon} alt="" />
            <p>Storehouse</p>
        </NavLink>
        <NavLink to='/users' className="sidebar-option">
            <img src={assets.users_icon} alt="" />
            <p>List Users</p>
        </NavLink>
        <NavLink to='/vouchers' className="sidebar-option">
            <img src={assets.voucher_icon} alt="" />
            <p>Vouchers</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
