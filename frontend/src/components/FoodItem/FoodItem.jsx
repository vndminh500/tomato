import React, {useContext, useEffect, useState} from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import { Link } from 'react-router-dom'

const FoodItem = ({id,name,price,description,image,stock = 20}) => {

    const {cartItems,addToCart,removeFromCart,url,stockAlertItemId,stockAlertTick} = useContext(StoreContext);
    const stockValue = Number(stock ?? 20);
    const [isStockShaking, setIsStockShaking] = useState(false);

    const getStockClassName = (quantity) => {
        if (quantity >= 15) return 'stock-high';
        if (quantity >= 10) return 'stock-medium';
        if (quantity >= 5) return 'stock-low';
        return 'stock-critical';
    };

    useEffect(() => {
        if (String(stockAlertItemId) === String(id) && stockAlertTick > 0) {
            setIsStockShaking(true);
            const timeoutId = setTimeout(() => setIsStockShaking(false), 420);
            return () => clearTimeout(timeoutId);
        }
    }, [stockAlertItemId, stockAlertTick, id]);

    if (!cartItems) {
        return null;
    }

  return (
    <div className='food-item'>
        <div className='food-item-img-container'>
            <Link to={`/menu/${id}`}><img className='food-item-image' src={url+"/images/"+image} alt="" /></Link>
            <span className={`food-item-stock-badge ${getStockClassName(stockValue)} ${isStockShaking ? 'stock-badge-shake' : ''}`}>In stock: {stockValue}</span>
            {!cartItems[id]
                ?<img className='add' onClick={()=>addToCart(id)} src = {assets.add_icon_white} alt = "" />
                :<div className='food-item-counter'> 
                    <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt="" />
                    <p>{cartItems[id]}</p>
                    <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt="" />
                </div>
            }
        </div>

        <div className="food-item-info">
            <div className="food-item-name-rating">
                <p>
                    {name}
                </p>
                <img src={assets.rating_starts} alt="" />
            </div>
                <p className="food-item-desc">
                    {description}
                </p>

                <p className='food-item-price'>
                    ${price}
                </p>
        </div>
    </div>
  )
}

export default FoodItem
