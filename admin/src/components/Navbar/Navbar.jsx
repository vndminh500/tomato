import React from 'react'
import './Navbar.css'
import {assets} from '../../assets/assets'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <div>
      <div className="navbar">
        <Link to='/'>
          <img src={assets.logo} alt="" className="logo" />
        </Link>
        <img src={assets.profile_image} alt="" className='profile' />
      </div>
    </div>
  )
}

export default Navbar
