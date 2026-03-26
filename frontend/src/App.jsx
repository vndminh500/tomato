import Navbar from './components/Navbar/Navbar'
import { Navigate, Route , Routes } from 'react-router-dom'
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
import NotFound from './pages/NotFound/NotFound'
import Breadcrumb from './components/Breadcrumb/Breadcrumb'
import Menu from './pages/Menu/Menu'
import MobileApp from './pages/MobileApp/MobileApp'
import Contact from './pages/Contact/Contact'
import { useParams } from 'react-router-dom'
import OrdersDetails from './pages/OrdersDetails/OrdersDetails'

const LegacyProductRedirect = () => {
  const { productId } = useParams()
  return <Navigate to={`/menu/${productId}`} replace />
}

const App = () => {

  const [showLogin,setShowLogin] = useState(false)

  return (
    <>
    <Toaster position='top-right' />
    {showLogin?<LoginPopup setShowLogin={setShowLogin}/>:<></>}
    <div className='app'> 
      <Navbar setShowLogin={setShowLogin} />
      <Breadcrumb />
      <ScrollToTop />
      <Routes>
        < Route path ='/' element = {<Home/>} />
        <Route path='/menu' element={<Menu />} />
        < Route path ='/cart' element = {<Cart setShowLogin={setShowLogin} />} />
        < Route path ='/order' element = {<PlaceOrder/>} />
        <Route path='/mobile-app' element={<MobileApp />} />
        <Route path='/verifyVnpay' element={<VerifyVnpay />} />
        <Route path='/myorders' element ={<MyOrders/>} />
        <Route path='/myorders/:orderId' element={<OrdersDetails />} />
        <Route path='/myorders/:orderId/*' element={<OrdersDetails />} />
        <Route path='/product' element={<Navigate to='/' replace />} />
        <Route path='/menu/:productId' element={<Product/>} />
        <Route path='/product/:productId' element={<LegacyProductRedirect />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact-us' element={<Contact />} />
        <Route path='/delivery' element={<Delivery />} />
        <Route path='/privacy' element={<Privacy />} />
        <Route path='/thank-you' element={<ThankYou />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='*' element={<NotFound />} />
        
      </Routes>
    </div>
      <Footer />
  </>
  )
}

export default App
