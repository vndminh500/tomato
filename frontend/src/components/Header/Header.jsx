import React, { useEffect, useState } from 'react'
import './Header.css'
import { assets } from '../../assets/assets'

const Header = () => {
  const slides = [
    {
      image: assets.header_img,
      contentTheme: 'light',
      buttonTheme: 'light',
      overlay:
        'linear-gradient(90deg, rgba(15,20,30,0.58) 0%, rgba(15,20,30,0.32) 42%, rgba(15,20,30,0.06) 100%)'
    },
    {
      image: assets.header_img2,
      contentTheme: 'light',
      buttonTheme: 'warm',
      overlay:
        'linear-gradient(90deg, rgba(17,24,39,0.62) 0%, rgba(17,24,39,0.34) 42%, rgba(17,24,39,0.08) 100%)'
    },
    {
      image: assets.header_img3,
      contentTheme: 'dark',
      buttonTheme: 'dark',
      overlay:
        'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 38%, rgba(255,255,255,0.12) 100%)'
    },
    {
      image: assets.header_img4,
      contentTheme: 'light',
      buttonTheme: 'light',
      overlay:
        'linear-gradient(90deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.3) 40%, rgba(15,23,42,0.05) 100%)'
    },
    {
      image: assets.header_img5,
      contentTheme: 'dark',
      buttonTheme: 'warm',
      overlay:
        'linear-gradient(90deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 40%, rgba(255,255,255,0.12) 100%)'
    }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const activeSlide = slides[currentImageIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className='header'>
      <div className='header-slides'>
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`header-slide ${index === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `${slide.overlay}, url(${slide.image})` }}
          />
        ))}
      </div>
      <div className={`header-contents header-contents-${activeSlide.contentTheme}`}>
        <h2>
            Order your favourite food here
            <p>
            Choose from a diverse menu featuring a delectable array of dishes crafted with the finest ingredients and
             culinary expertise. Our mission is to satisfy your cravings and elevate your dining experience,
             one delicious meal at a time.
            </p>
            <a href="/#explore-menu">
              <button className={`header-btn header-btn-${activeSlide.buttonTheme}`}>
                View Menu
              </button>
            </a>
        </h2>
      </div>
    </div>
  )
}

export default Header
