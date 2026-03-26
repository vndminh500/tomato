import React, { useEffect, useState } from 'react'
import './Storehouse.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Storehouse = ({ url }) => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const fetchItems = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true)
      }
      const response = await axios.get(`${url}/api/food/list`)
      if (response.data?.success) {
        setItems(response.data.data || [])
      } else if (!silent) {
        toast.error('Unable to load storehouse items')
      }
    } catch {
      if (!silent) {
        toast.error('Connection error')
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchItems()
    const intervalId = setInterval(() => fetchItems(true), 5000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [items, currentPage])

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage)
  const getStockClassName = (quantity) => {
    if (quantity >= 15) return 'stock-high'
    if (quantity >= 10) return 'stock-medium'
    if (quantity >= 5) return 'stock-low'
    return 'stock-critical'
  }

  return (
    <div className='storehouse add flex-col'>
      <p>Storehouse Inventory</p>
      <div className='storehouse-table'>
        <div className='storehouse-table-row title'>
          <b>Image</b>
          <b>Name</b>
          <b>Quantity in stock</b>
        </div>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className='storehouse-table-row storehouse-skeleton-row'>
              <span className='storehouse-skeleton-box'></span>
              <span className='storehouse-skeleton-line'></span>
              <span className='storehouse-skeleton-line short'></span>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className='storehouse-empty-state'>
            <p>No products found.</p>
            <span>Add products to start tracking inventory.</span>
          </div>
        ) : (
          paginatedItems.map((item, index) => {
            const stockValue = Number(item.stock ?? 20)
            return (
              <div key={`${item._id}-${index}`} className='storehouse-table-row'>
                <img src={`${url}/images/${item.image}`} alt={item.name} />
                <p>{item.name}</p>
                <p className={`storehouse-stock ${getStockClassName(stockValue)}`}>{stockValue}</p>
              </div>
            )
          })
        )}
      </div>

      {!isLoading && items.length > 0 && (
        <div className='storehouse-pagination'>
          <button
            type='button'
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <div className='storehouse-pagination-numbers'>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1
              return (
                <button
                  type='button'
                  key={pageNumber}
                  className={currentPage === pageNumber ? 'active' : ''}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>
          <button
            type='button'
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Storehouse
