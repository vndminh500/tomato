import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../../components/FoodItem/FoodItem';
import './Favorites.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const Favorites = () => {
  const { food_list, favorites } = useContext(StoreContext);

  const favoriteProducts = useMemo(
    () => food_list.filter((item) => favorites[String(item._id)]),
    [food_list, favorites]
  );

  return (
    <div className='favorites-page'>
      <header className='favorites-hero'>
        <div className='favorites-hero-inner'>
          <span className='favorites-hero-badge'>
            <FaHeart aria-hidden />
            Saved for you
          </span>
          <h1>Favorite Products</h1>
          <p className='favorites-hero-sub'>
          All the products you love will be displayed here.
          </p>
        </div>
      </header>

      {favoriteProducts.length === 0 ? (
        <div className='favorites-empty'>
          <div className='favorites-empty-icon' aria-hidden>
            <FaRegHeart />
          </div>
          <h2>No favorites yet</h2>
          <p>Tap the heart on any product card to save it here.</p>
          <Link to='/menu' className='favorites-browse-btn'>
            Browse menu
          </Link>
        </div>
      ) : (
        <section className='favorites-grid-section'>
          <p className='favorites-count'>
            {favoriteProducts.length}{' '}
            {favoriteProducts.length === 1 ? 'product' : 'products'}
          </p>
          <div className='favorites-grid'>
            {favoriteProducts.map((item) => (
              <FoodItem
                key={item._id}
                id={item._id}
                name={item.name}
                description={item.description}
                price={item.price}
                image={item.image}
                stock={item.stock ?? 20}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Favorites;
