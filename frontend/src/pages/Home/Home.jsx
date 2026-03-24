import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'

const Home = () => {

    const [category, setCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

  return (
    <div>
      <Header/>
      <ExploreMenu category={category} setCategory = {setCategory} />
      <FoodDisplay category={category} currentPage={currentPage} setCurrentPage={setCurrentPage}/>
      <AppDownload/>
    </div>
  )
}

export default Home
