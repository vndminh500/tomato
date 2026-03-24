import React from 'react';
import './Comment.css';

const Comment = ({ comment }) => {
    return (
        <div className="comment">
            <div className="comment-header">
                <span className="comment-author">{comment.userName}</span>
                <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="comment-body">
                <div className="comment-rating">
                    {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`star ${i < comment.rating ? 'filled' : ''}`}>&#9733;</span>
                    ))}
                </div>
                <p className="comment-text">{comment.comment}</p>
            </div>
        </div>
    );
};

export default Comment;
