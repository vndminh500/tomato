import React from 'react'
import './ExploreMenu.css'
import {menu_list} from '../../assets/assets'

const ExploreMenu = ({category, setCategory}) => {
  return (
    <section className='explore-menu' id='explore-menu'>
      <div className='explore-menu-heading'>
        <span className='explore-menu-badge'>Top picks today</span>
        <h1>
          Explore our menu
        </h1>
        <p className='explore-menu-text'>
        Indulge in a curated selection of gourmet dishes. We are dedicated to fulfilling 
        your culinary desires and transforming every meal into an exceptional dining moment.
        </p>
        <p className='explore-menu-selected'>
          Showing: <span>{category === "All" ? "All Categories" : category}</span>
        </p>
      </div>

      <div className='explore-menu-list'>
        {menu_list.map((item, index) => {
          const isActive = category === item.menu_name;

          return (
            <button
              onClick={() => setCategory(prev => prev === item.menu_name ? "All" : item.menu_name)}
              key={index}
              className={`explore-menu-list-item ${isActive ? "active" : ""}`}
              type='button'
            >
              <img src={item.menu_image} alt={item.menu_name} />
              <p>{item.menu_name}</p>
            </button>
          )
        })}
      </div>
      <hr />
    </section>
  )
}

export default ExploreMenu
