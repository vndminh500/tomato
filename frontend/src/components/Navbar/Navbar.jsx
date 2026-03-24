import React, { useState, useContext, useEffect, useRef } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState('home');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [filteredFood, setFilteredFood] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  const { getTotalCartAmount, token, setToken, food_list, url } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMenu('home');
    navigate({ pathname: '/', hash: '' });
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  useEffect(() => {
    if (debouncedSearchValue) {
      const filtered = food_list.filter((item) =>
        item.name.toLowerCase().includes(debouncedSearchValue.toLowerCase())
      );
      setFilteredFood(filtered);
    } else {
      setFilteredFood([]);
    }
    setActiveIndex(-1); 
  }, [debouncedSearchValue, food_list]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/');
  };

  const handleSuggestionClick = (id) => {
    setSearchValue('');
    setFilteredFood([]);
    setIsSearchVisible(false);
    navigate(`/product/${id}`);
  };

  const handleKeyDown = (e) => {
    if (filteredFood.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex === filteredFood.length - 1 ? 0 : prevIndex + 1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prevIndex) =>
          prevIndex <= 0 ? filteredFood.length - 1 : prevIndex - 1
        );
      } else if (e.key === 'Enter') {
        if (activeIndex > -1) {
          e.preventDefault();
          handleSuggestionClick(filteredFood[activeIndex]._id);
        }
      }
    }
  };

  const getHighlightedText = (text, highlight) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <b key={i}>{part}</b>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleMouseLeave = () => {
    if (searchValue === '') {
      setIsSearchVisible(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setFilteredFood([]);
        if (searchValue === '') {
          setIsSearchVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchValue]);


  return (
    <div className='navbar'>
      <Link to='/' onClick={handleHomeClick}>
        <img src={assets.logo} alt='' className='logo' />
      </Link>
      <ul className='navbar-menu'>
        <Link
          to='/'
          onClick={handleHomeClick}
          className={menu === 'home' ? 'active' : ''}
        >
          Home
        </Link>
        <a
          href='/#explore-menu'
          onClick={() => setMenu('menu')}
          className={menu === 'menu' ? 'active' : ''}
        >
          Menu
        </a>
        <a
          href='/#app-download'
          onClick={() => setMenu('mobile-app')}
          className={menu === 'mobile-app' ? 'active' : ''}
        >
          Mobile app
        </a>
        <a
          href='#footer'
          onClick={() => setMenu('contact-us')}
          className={menu === 'contact-us' ? 'active' : ''}
        >
          Contact us
        </a>
      </ul>

      <div className='navbar-right'>
        <div
          className='search-container'
          ref={searchContainerRef}
          onMouseEnter={() => setIsSearchVisible(true)}
          onMouseLeave={handleMouseLeave}
        >
          <input
            type='text'
            placeholder='Search'
            className={`search-input ${
              isSearchVisible || searchValue ? 'active' : ''
            }`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <img src={assets.search_icon} alt='' className='search-icon' />
          {debouncedSearchValue && (
            <div className='suggestions-list'>
              {filteredFood.length > 0 ? (
                filteredFood.map((item, index) => (
                  <li
                    key={item._id}
                    className={index === activeIndex ? 'active' : ''}
                    onClick={() => handleSuggestionClick(item._id)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <img src={`${url}/images/${item.image}`} alt={item.name} />
                    {getHighlightedText(item.name, searchValue)}
                  </li>
                ))
              ) : (
                <div className='no-suggestions'>No results found</div>
              )}
            </div>
          )}
        </div>
        <div className='navbar-search-icon'>
          <Link to='/cart'>
            <img src={assets.basket_icon} alt='' />
          </Link>
          <div className={getTotalCartAmount() === 0 ? '' : 'dot'}></div>
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign in</button>
        ) : (
          <div className='navbar-profile'>
            <img src={assets.profile_icon} alt='' />
            <ul className='navbar-profile-dropdown'>
              <li onClick={() => navigate('/myorders')}>
                <img src={assets.bag_icon} alt='' />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt='' />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
