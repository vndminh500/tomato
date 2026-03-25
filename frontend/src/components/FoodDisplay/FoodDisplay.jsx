import React, {useContext, useEffect, useRef} from 'react'
import './FoodDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({category, currentPage, setCurrentPage}) => {

    const {food_list} = useContext(StoreContext)
    const foodDisplayRef = useRef(null);
    const isInitialRender = useRef(true);

    const itemsPerPage = 12;
    const filteredFoodList = food_list.filter(item => category === "All" || category === item.category);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredFoodList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredFoodList.length / itemsPerPage);

    const paginate = (pageNumber) => {
      setCurrentPage(pageNumber);
    }

    // Chặn trường hợp currentPage đang lớn hơn tổng trang sau khi đổi category
    useEffect(() => {
      if (totalPages === 0) {
        if (currentPage !== 1) setCurrentPage(1);
        return;
      }

      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [category, totalPages]);

    useEffect(() => {
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }

      if (foodDisplayRef.current) {
        foodDisplayRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [currentPage]);


  return (
    <div className='food-display' id = 'food-display' ref={foodDisplayRef}>
      <h2>
        Top dishes near you
      </h2>

      <div className='food-display-list' key={currentPage}>
        {currentItems.map((item,index)=>{
            return <FoodItem key = {index} id={item._id} name = {item.name} description = {item.description} price = {item.price} image = {item.image} />
        })}
      </div>
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
    </div>
  )
}

export default FoodDisplay

