import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
            <img src={assets.logo} alt="Potato logo" className="footer-brand-logo" />
            <p>Experience the best of fresh dining from the comfort of your home. We pride ourselves on quality service and a customer-first approach.</p>
            <div className="footer-social-icons">
                <a href="#" aria-label="Potato on Facebook"><img src={assets.facebook_icon} alt="Facebook" /></a>
                <a href="#" aria-label="Potato on Twitter"><img src={assets.twitter_icon} alt="Twitter" /></a>
                <a href="#" aria-label="Potato on LinkedIn"><img src={assets.linkedin_icon} alt="LinkedIn" /></a>
            </div>
        </div>

        <div className="footer-content-center">
            <h2>COMPANY</h2>
            <ul>
                <li><Link to='/'>Home</Link></li>
                <li><Link to='/about'>About us</Link></li>
                <li><Link to='/delivery'>Delivery</Link></li>
                <li><Link to='/privacy'>Privacy policy</Link></li>
                <li><Link to='/complaints-refund'>Complaints and refund policy</Link></li>
            </ul>
        </div>

        <div className="footer-content-right">
            <h2>GET IN TOUCH</h2>
            <div className='footer-contact'>
              <p className='footer-contact-line'>+84 123 456 789</p>
              <p className='footer-contact-line'>potato@gmail.com</p>
            </div>
            <div className='footer-newsletter'>
              <p>Get latest offers in your inbox</p>
              <div className='footer-newsletter-box'>
                <input type="email" placeholder='Your email' />
                <button type='button'>Subscribe</button>
              </div>
            </div>
        </div>
      </div>
      <hr />
      <p className='footer-copyright'>
        Copyright 2026 © Potato.com - All Right Reserved.
      </p>
    </footer>
  )
}

export default Footer
