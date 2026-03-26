import React, {useContext, useState, useEffect} from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Cart = () => {

  const {cartItems, food_list,removeFromCart,getTotalCartAmount, url, token, promoCode, discount, discountAmount, message, applyPromoCode, setPromoCode, setMessage} = useContext(StoreContext);
  const [inputPromoCode, setInputPromoCode] = useState('');

  const navigate = useNavigate();

  const handleApplyPromoCode = () => {
    applyPromoCode(inputPromoCode);
  };

  useEffect(() => {
    return () => {
        setMessage('');
        setPromoCode('');
    };
}, [navigate, setMessage, setPromoCode]);

  return (
    <div className='cart'>
      <div className='cart-header'>
        <span className='cart-badge'>Your Order</span>
        <h1>Shopping Cart</h1>
        <p>Review your items, apply a voucher, and proceed to checkout in one step.</p>
      </div>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
          {food_list.some((item) => cartItems[item._id] > 0) ? (
            food_list.map((item,index)=>{
              if(cartItems[item._id]>0) {
                return (
                  <div key={index}>
                    <div className="cart-items-title cart-items-item">
                    <img src={url+"/images/" +item.image} alt={item.name} />
                    <p>{item.name}</p>
                    <p>${item.price}</p>
                    <p>{cartItems[item._id]}</p>
                    <p>${item.price*cartItems[item._id]}</p>
                    <button onClick={()=>removeFromCart(item._id)} className='cross' type='button'>x</button>
                  </div>
                  <hr />
                  </div>
                )
              }
            })
          ) : (
            <div className='cart-empty-state'>
              <h3>Your cart is empty</h3>
              <p>Add delicious items from the menu and come back here.</p>
              <button type='button' onClick={() => navigate('/')}>Browse Menu</button>
            </div>
          )}

      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart totals </h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            {discount > 0 && (
                            <>
                                <div className="cart-total-details">
                                    <p>Discount</p>
                                    <p>- ${discountAmount.toFixed(2)}</p>
                                </div>
                                <hr />
                            </>
                        )}
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount()===0?0:2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${(getTotalCartAmount() - discountAmount + (getTotalCartAmount() === 0 ? 0 : 2)).toFixed(2)}</b>
            </div>
          </div>

          <button onClick={()=>navigate('/order')}>PROCEED TO CHECKOUT</button>

        </div>
          <div className="cart-promocode">
            <div>
              <p>
                If you have a discount code. Enter it here 
              </p>

              <div className="cart-promocode-input">
              <input 
                                type="text" 
                                placeholder='Voucher Code' 
                                value={inputPromoCode} 
                                onChange={(e) => setInputPromoCode(e.target.value)} 
                            />
                            <button onClick={handleApplyPromoCode}>Submit</button>
              </div>
              {message && (
                <p className={`cart-promocode-message ${discount > 0 ? 'success' : 'error'}`}>{message}</p>
              )}
            </div>
          </div>

      </div>
    </div>
  )
}

export default Cart
