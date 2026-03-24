import React, { useState, useContext } from 'react';
import './CommentForm.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const CommentForm = ({ productId, onCommentAdded }) => {
    const { url, token } = useContext(StoreContext);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            alert("You must be logged in to comment");
            return;
        }
        if (rating === 0 || comment.trim() === '') {
            alert("Please provide a rating and a comment");
            return;
        }

        try {
            const response = await axios.post(`${url}/api/comment/add`, {
                productId,
                rating,
                comment
            }, {
                headers: { token }
            });

            if (response.data.success) {
                setRating(0);
                setComment('');
                if (onCommentAdded) {
                    onCommentAdded();
                }
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("An error occurred while adding your comment.");
        }
    };

    return (
        <form className="comment-form" onSubmit={handleSubmit}>
            <h3>Add a review</h3>
            <div className="rating-input">
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <label key={index}>
                            <input
                                type="radio"
                                name="rating"
                                value={ratingValue}
                                onClick={() => setRating(ratingValue)}
                            />
                            <span className={`star ${ratingValue <= rating ? 'filled' : ''}`}>&#9733;</span>
                        </label>
                    );
                })}
            </div>
            <textarea
                placeholder="Write your comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <button type="submit">Submit</button>
        </form>
    );
};

export default CommentForm;
