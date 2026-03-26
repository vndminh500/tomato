import React from 'react'
import './Navbar.css'
import {assets} from '../../assets/assets'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <header className="navbar">
      <Link to='/' className="navbar-brand">
        <img src={assets.logo} alt="Tomato admin logo" className="logo" />
      </Link>
      <img src={assets.profile_image} alt="Admin profile" className='profile' />
    </header>
  )
}

export default Navbar
