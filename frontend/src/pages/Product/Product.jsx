import React, { useContext, useEffect, useState } from 'react'
import './Product.css'
import { useParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import Comment from '../../components/Comments/Comment'
import CommentForm from '../../components/Comments/CommentForm'
import { assets } from '../../assets/assets'
import { FaFacebookMessenger, FaInstagram, FaTiktok, FaPinterest } from 'react-icons/fa'
import Description from '../../components/Description/Description'
import FoodItem from '../../components/FoodItem/FoodItem'


const Product = () => {
    const { productId } = useParams();
    const { food_list, addToCart, url, cartItems, removeFromCart } = useContext(StoreContext);
    const product = food_list.find((e) => e._id === productId);
    const [comments, setComments] = useState([]);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`${url}/api/comment/list/${productId}`);
            if (response.data.success) {
                setComments(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchComments();
        }
    }, [productId]);

    if (!product) {
        return <div>Product not found</div>
    }

    const similarProducts = food_list.filter(item => item.category === product.category && item._id !== product._id).slice(0, 4);

    return (
        <div>
            <div className='product-display'>
                <div className="product-display-left">
                    <div className="product-display-img">
                        <img src={url + "/images/" + product.image} alt="" />
                    </div>
                </div>
                <div className="product-display-right">
                    <div className='product-name-rating'>
                        <h1>{product.name}</h1>
                        <img src={assets.rating_starts} alt="" />
                    </div>
                    <p className='product-display-right-description'>{product.description}</p>
                    <div className='product-display-right-price'>${product.price}</div>
                    {!cartItems[product._id]
                        ? <button onClick={() => addToCart(product._id)}>ADD TO CART</button>
                        : <div className='food-item-counter food-item-counter-fix'>
                            <img onClick={() => removeFromCart(product._id)} src={assets.remove_icon_red} alt="" />
                            <p>{cartItems[product._id]}</p>
                            <img onClick={() => addToCart(product._id)} src={assets.add_icon_green} alt="" />
                        </div>
                    }
                    <div className='product-share'>
                        <p>Share:</p>
                        <div className='share-icons'>
                            <a href="https://www.messenger.com/" target="_blank" rel="noopener noreferrer">
                                <FaFacebookMessenger />
                            </a>
                            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                                <FaInstagram />
                            </a>
                            <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer">
                                <FaTiktok />
                            </a>
                            <a href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer">
                                <FaPinterest />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <Description productName={product.name} />
            <div className="product-comments">
                <h2>Reviews</h2>
                <CommentForm productId={productId} onCommentAdded={fetchComments} />
                <div className="comment-list">
                    {comments.length > 0 ? (
                        comments.map(comment => <Comment key={comment._id} comment={comment} />)
                    ) : (
                        <p>No comments yet. Be the first to comment!</p>
                    )}
                </div>
            </div>
            <div className='similar-products'>
                <h2>Similar Products</h2>
                <div className='similar-products-list'>
                    {similarProducts.map((item) => (
                        <FoodItem key={item._id} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Product
