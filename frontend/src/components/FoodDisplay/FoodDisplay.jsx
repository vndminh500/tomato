import React, {useContext, useEffect, useMemo, useRef} from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({
  category = "All",
  currentPage = 1,
  setCurrentPage,
  itemsPerPage = 12,
  showPagination = true,
  title = "Trending Now",
  randomCount = 0,
}) => {

    const {food_list} = useContext(StoreContext)
    const foodDisplayRef = useRef(null);
    const isInitialRender = useRef(true);

    const filteredFoodList = useMemo(
      () => food_list.filter(item => category === "All" || category === item.category),
      [food_list, category]
    );
    const randomItems = useMemo(() => {
      if (!randomCount || filteredFoodList.length <= randomCount) {
        return filteredFoodList;
      }

      const shuffled = [...filteredFoodList];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
      }
      return shuffled.slice(0, randomCount);
    }, [filteredFoodList, randomCount]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedItems = filteredFoodList.slice(indexOfFirstItem, indexOfLastItem);
    const currentItems = randomCount ? randomItems : paginatedItems;
    const totalPages = Math.ceil(filteredFoodList.length / itemsPerPage);

    const paginate = (pageNumber) => {
      if (setCurrentPage) {
        setCurrentPage(pageNumber);
      }
    }

    useEffect(() => {
      if (!showPagination || totalPages === 0) {
        if (currentPage !== 1 && setCurrentPage) setCurrentPage(1);
        return;
      }

      if (currentPage > totalPages && setCurrentPage) {
        setCurrentPage(totalPages);
      }
    }, [category, totalPages, showPagination, currentPage, setCurrentPage]);

    useEffect(() => {
      if (!showPagination || isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }

      if (foodDisplayRef.current) {
        foodDisplayRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [currentPage, showPagination]);


  return (
    <div className='food-display' id = 'food-display' ref={foodDisplayRef}>
      <h2 className={title === 'Trending Now' ? 'trending-title' : ''}>
        {title}
      </h2>

      <div className='food-display-list' key={currentPage}>
        {currentItems.map((item,index)=>{
            return <FoodItem key = {index} id={item._id} name = {item.name} description = {item.description} price = {item.price} image = {item.image} stock={item.stock ?? 20} />
        })}
      </div>
      {showPagination && totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </button>
          {[...Array(totalPages).keys()].map(number => (
            <button key={number + 1} onClick={() => paginate(number + 1)} className={currentPage === number + 1 ? 'active' : ''}>
              {number + 1}
            </button>
          ))}
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default FoodDisplay

