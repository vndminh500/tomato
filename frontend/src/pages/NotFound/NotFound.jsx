import React from 'react';
import './NotFound.css';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-visual">
        <h1 className="not-found-404">404</h1>
        <img
          src={assets.logo}
          alt="Sad Potato"
          className="not-found-avatar"
        />
      </div>

      <h2 className="not-found-title">Oops! This dish is not on the menu.</h2>

      <p className="not-found-subtitle">
        
It seems the page you're looking for has been lost. Don't worry, come back and discover other delicious dishes!
      </p>

      <div className="not-found-actions">
        <button className="btn-home" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;

