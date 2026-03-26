import React from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'

const Home = () => {

  return (
    <div>
      <Header/>
      <FoodDisplay
        category="All"
        title="Trending Now"
        randomCount={8}
        showPagination={false}
      />
      <AppDownload/>
    </div>
  )
}

export default Home
