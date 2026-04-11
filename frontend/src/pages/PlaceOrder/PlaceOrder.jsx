import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const DELIVERY_FEE = 15000;
/** Mã đơn vị hành chính TP.HCM (provinces.open-api.vn) — cửa hàng chỉ giao trong TP.HCM */
const HCM_CITY_CODE = 79;

const PlaceOrder = () => {

  const {getTotalCartAmount,token,food_list,cartItems,url, clearCart, discountAmount} = useContext(StoreContext)

  const [data,setData] = useState({
    firstName:"",
    lastName:"",
    email:"",
    city:"",
    district:"",
    street:"",
    phone:""
  })
  const [locations, setLocations] = useState([]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => {
      if (name === 'city') {
        return { ...prev, city: value, district: "" };
      }
      return ({ ...prev, [name]: value });
    })
  }

  const [paymentMethod, setPaymentMethod] = useState('vnpay');

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    let orderItems = [];
    food_list.map((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = item;
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo)
      }
    })
    let orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() - discountAmount + DELIVERY_FEE,
      paymentMethod: paymentMethod
    }
    console.log("Placing order with payment method:", paymentMethod);
    console.log("Order data:", orderData);

    if (paymentMethod === 'vnpay') {
      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } })
      if (response.data.success) {
        const { vnpayUrl } = response.data;
        window.location.replace(vnpayUrl);
      }
      else {
        toast.error(response.data.message || "Something went wrong");
      }
    }
    else if (paymentMethod === 'cod') {
      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } })
      if (response.data.success) {
        toast.success("Order placed successfully");
        navigate('/thank-you');
        clearCart();
      }
      else {
        toast.error(response.data.message || "Something went wrong");
      }
    }
  }

  const navigate = useNavigate();
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("https://provinces.open-api.vn/api/?depth=2");
        const list = response.data || [];
        setLocations(list);
        const hcmc = list.find((p) => p.code === HCM_CITY_CODE);
        if (hcmc?.name) {
          setData((prev) => ({ ...prev, city: hcmc.name }));
        }
      } catch {
        toast.error("Unable to load city and district list");
      }
    };
    fetchLocations();
  }, []);

  const storeCity = locations.find((p) => p.code === HCM_CITY_CODE);

  useEffect(()=>{
    if (!token) {
      navigate('/cart')
    }
    else if (getTotalCartAmount()===0) {
      navigate('/cart')
    }
  },[token])

  const districtOptions = storeCity?.districts || [];

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <span className='order-badge'>Checkout</span>
        <p className="title">Delivery Information</p>
        <p className='order-subtitle'>Fill in your details so we can deliver your order quickly and safely.</p>
        <div className='multi-fields'>
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' />
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' />
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email' />

        <div className='multi-fields'>
          <select
            required
            name="city"
            onChange={onChangeHandler}
            value={data.city}
            aria-label="City"
            disabled={!storeCity}
          >
            {storeCity ? (
              <option value={storeCity.name}>{storeCity.name}</option>
            ) : (
              <option value="">Đang tải thành phố…</option>
            )}
          </select>
          <select
            required
            name='district'
            onChange={onChangeHandler}
            value={data.district}
            disabled={!storeCity}
          >
            <option value=''>Select district</option>
            {districtOptions.map((district) => (
              <option key={district.code} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Address' />

        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone number' />
        <div className="place-order-payment">
          <p className="title">Payment Method</p>
          <div className="payment-options">
            <label className={paymentMethod === 'vnpay' ? 'active' : ''}>
              <input type="radio" name="paymentMethod" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} />
              Online Payment
            </label>
            <label className={paymentMethod === 'cod' ? 'active' : ''}>
              <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              Cash on Delivery
            </label>
          </div>
        </div>
      </div>
      
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>{getTotalCartAmount()} VND</p>
            </div>
            <hr />
            {discountAmount > 0 && (
              <>
                <div className="cart-total-details">
                  <p>Discount</p>
                  <p>- {discountAmount} VND</p>
                </div>
                <hr />
              </>
            )}
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>{DELIVERY_FEE} VND</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>{(getTotalCartAmount() - discountAmount + DELIVERY_FEE)} VND</b>
            </div>
          </div>
          <button type='submit'>PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
