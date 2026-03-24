import React from 'react'
import Navbar from './components/Navbar/Navbar'
import { Route , Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import { useState } from 'react'
import VerifyVnpay from './pages/Verify/VerifyVnpay'
import MyOrders from './pages/MyOrders/MyOrders'
import Product from './pages/Product/Product'
import About from './pages/About/About'
import Delivery from './pages/Delivery/Delivery'
import Privacy from './pages/Privacy/Privacy'
import ThankYou from './pages/ThankYou/ThankYou';
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Profile from './pages/Profile/Profile';
import { Toaster } from 'react-hot-toast';

const App = () => {

  const [showLogin,setShowLogin] = useState(false)

  return (
    <>
    <Toaster position='top-right' />
    {showLogin?<LoginPopup setShowLogin={setShowLogin}/>:<></>}
    <div className='app'> 
      <Navbar setShowLogin={setShowLogin} />
      <ScrollToTop />
      <Routes>
        < Route path ='/' element = {<Home/>} />
        < Route path ='/cart' element = {<Cart/>} />
        < Route path ='/order' element = {<PlaceOrder/>} />
        <Route path='/verifyVnpay' element={<VerifyVnpay />} />
        <Route path='/myorders' element ={<MyOrders/>} />
        <Route path='/product/:productId' element={<Product/>} />
        <Route path='/about' element={<About />} />
        <Route path='/delivery' element={<Delivery />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/thank-you' element={<ThankYou />} />
        <Route path='/profile' element={<Profile />} />
        
      </Routes>
    </div>
      <Footer />
  </>
  )
}

export default App
