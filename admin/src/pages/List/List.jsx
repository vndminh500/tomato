import React, {useEffect, useState} from 'react'
import './List.css'
import axios from 'axios';
import {toast} from "react-toastify"

const List = ({url, token}) => {

    const [list,setList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingId, setRemovingId] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchList = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${url}/api/food/list`);
            if (response.data.success) {
                setList(response.data.data);
            }
            else {
                toast.error("Unable to load foods")
            }
        } catch {
            toast.error("Connection error");
        } finally {
            setIsLoading(false);
        }
    }

    const removeFood = async(foodId) => {
        try {
            setRemovingId(foodId);
            const response = await axios.post(`${url}/api/food/remove`,{id:foodId},{
                headers:{token}
            })
            await fetchList();
            if (response.data.success) {
                toast.success(response.data.message)
            }
            else {
                toast.error("Unable to remove food");
            }
        } catch {
            toast.error("Connection error");
        } finally {
            setRemovingId("");
        }
    }

    useEffect(()=>{
        fetchList();
    },[])

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [list, currentPage])

    const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = list.slice(startIndex, startIndex + itemsPerPage);
  
    return (  
    <div className='list add flex-col'>
        <p>All foods list</p>
        <div className="list-table">
            <div className="list-table-format title">
                <b>Image</b>
                <b>Name</b>
                <b>Category</b>
                <b>Price</b>
                <b>Remove</b>
            </div>
            {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className='list-table-format list-skeleton-row'>
                        <span className='list-skeleton-box'></span>
                        <span className='list-skeleton-line'></span>
                        <span className='list-skeleton-line short'></span>
                        <span className='list-skeleton-line short'></span>
                        <span className='list-skeleton-line tiny'></span>
                    </div>
                ))
            ) : list.length === 0 ? (
                <div className='list-empty-state'>
                    <p>No food items yet.</p>
                    <span>Go to Add Items to create your first menu item.</span>
                </div>
            ) : paginatedItems.map((item, index) => (
                <div key={index} className='list-table-format'>
                    <img src={`${url}/images/` + item.image} alt="" /> 
                    <p>{item.name}</p>
                    <p>{item.category}</p>
                    <p>${item.price}</p>
                    <button
                        onClick={() => removeFood(item._id)}
                        className='list-remove-btn'
                        type='button'
                        disabled={removingId === item._id}
                    >
                        {removingId === item._id ? "..." : "X"}
                    </button>
                </div>
            ))}
        </div>
        {!isLoading && list.length > 0 && (
            <div className='list-pagination'>
                <button
                    type='button'
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                >
                    Prev
                </button>
                <div className='list-pagination-numbers'>
                    {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        )}
    </div>
  )
}

export default List
