import React, { useEffect, useMemo, useRef, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const CATEGORIES = [
    'Salad',
    'Rolls',
    'Deserts',
    'Sandwich',
    'Cake',
    'Pure Veg',
    'Pasta',
    'Noodles'
]

const getStockClassName = (quantity) => {
    if (quantity >= 15) return 'stock-high'
    if (quantity >= 10) return 'stock-medium'
    if (quantity >= 5) return 'stock-low'
    return 'stock-critical'
}

const List = ({ url, token, canUpdateFood = false, canDeleteFood = false }) => {
    const [list, setList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [busyFoodId, setBusyFoodId] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8
    const [categoryFilter, setCategoryFilter] = useState('All')

    const showActions = canUpdateFood || canDeleteFood
    const menuRef = useRef(null)

    const [openMenuFoodId, setOpenMenuFoodId] = useState(null)
    const [editingFood, setEditingFood] = useState(null)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editPrice, setEditPrice] = useState('')
    const [editCategory, setEditCategory] = useState('Salad')
    const [editStock, setEditStock] = useState('20')
    const [editImageFile, setEditImageFile] = useState(null)
    const [editSubmitting, setEditSubmitting] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState(null)

    const editPreviewUrl = useMemo(() => {
        if (!editImageFile) return null
        return URL.createObjectURL(editImageFile)
    }, [editImageFile])

    useEffect(() => {
        return () => {
            if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl)
        }
    }, [editPreviewUrl])

    const categoryOptions = useMemo(() => {
        const set = new Set(CATEGORIES)
        list.forEach((item) => {
            if (item.category) set.add(item.category)
        })
        return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
    }, [list])

    const filteredList = useMemo(() => {
        if (!categoryFilter || categoryFilter === 'All') return list
        return list.filter((item) => item.category === categoryFilter)
    }, [list, categoryFilter])

    const fetchList = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get(`${url}/api/food/list`)
            if (response.data.success) {
                setList(response.data.data)
            } else {
                toast.error('Unable to load foods')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!openMenuFoodId) return
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuFoodId(null)
            }
        }
        document.addEventListener('mousedown', onDocMouseDown)
        return () => document.removeEventListener('mousedown', onDocMouseDown)
    }, [openMenuFoodId])

    const openEditModal = (item) => {
        setOpenMenuFoodId(null)
        setEditingFood(item)
        setEditName(item.name || '')
        setEditDescription(item.description || '')
        setEditPrice(String(item.price ?? ''))
        setEditCategory(item.category || 'Salad')
        setEditStock(String(item.stock ?? 20))
        setEditImageFile(null)
    }

    const closeEditModal = () => {
        if (editSubmitting) return
        setEditingFood(null)
        setEditImageFile(null)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editingFood) return
        if (!editName.trim() || !editDescription.trim()) {
            toast.error('Name and description are required')
            return
        }
        try {
            setEditSubmitting(true)
            const formData = new FormData()
            formData.append('id', editingFood._id)
            formData.append('name', editName.trim())
            formData.append('description', editDescription.trim())
            formData.append('price', Number(editPrice))
            formData.append('category', editCategory)
            formData.append('stock', Number(editStock) || 0)
            if (editImageFile) {
                formData.append('image', editImageFile)
            }
            const response = await axios.post(`${url}/api/food/update`, formData, {
                headers: { token }
            })
            if (response.data.success) {
                const updated = response.data.data
                setList((prev) =>
                    prev.map((f) => (String(f._id) === String(updated._id) ? { ...f, ...updated } : f))
                )
                toast.success(response.data.message || 'Updated')
                setEditingFood(null)
                setEditImageFile(null)
            } else {
                toast.error(response.data.message || 'Update failed')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setEditSubmitting(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget || !canDeleteFood) return
        const { id } = deleteTarget
        try {
            setBusyFoodId(id)
            const response = await axios.post(
                `${url}/api/food/remove`,
                { id },
                { headers: { token } }
            )
            if (response.data.success) {
                setList((prev) => prev.filter((f) => String(f._id) !== String(id)))
                toast.success(response.data.message || 'Removed')
            } else {
                toast.error(response.data.message || 'Unable to remove food')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setBusyFoodId('')
            setDeleteTarget(null)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [categoryFilter])

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage))
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [filteredList.length, currentPage])

    const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedItems = filteredList.slice(startIndex, startIndex + itemsPerPage)

    return (
        <div className={`list flex-col${showActions ? ' list--with-actions' : ''}`}>
            <div className="list-toolbar">
                <p className="list-toolbar-title">All foods list</p>
                <label className="list-filter-label">
                    <span className="list-filter-text">Filter by category</span>
                    <select
                        className="list-filter-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        aria-label="Filter by category"
                    >
                        {categoryOptions.map((c) => (
                            <option key={c} value={c}>
                                {c === 'All' ? 'All categories' : c}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="list-table">
                <div className="list-table-format title">
                    <b>Image</b>
                    <b>Name</b>
                    <b>Quantity in stock</b>
                    <b>Category</b>
                    <b>Price</b>
                    {showActions ? <b className="list-actions-header">Actions</b> : null}
                </div>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="list-table-format list-skeleton-row">
                            <span className="list-skeleton-box"></span>
                            <span className="list-skeleton-line"></span>
                            <span className="list-skeleton-line short"></span>
                            <span className="list-skeleton-line short"></span>
                            <span className="list-skeleton-line short"></span>
                            {showActions ? <span className="list-skeleton-line tiny"></span> : null}
                        </div>
                    ))
                ) : list.length === 0 ? (
                    <div className="list-empty-state">
                        <p>No food items yet.</p>
                        <span>Go to Add Items to create your first menu item.</span>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="list-empty-state">
                        <p>No items in this category.</p>
                        <span>Choose another category or select &quot;All categories&quot;.</span>
                    </div>
                ) : (
                    paginatedItems.map((item) => (
                        <div
                            key={item._id}
                            className={`list-table-format${openMenuFoodId === item._id ? ' list-table-format--menu-open' : ''}`}
                        >
                            <img src={`${url}/images/${item.image}`} alt="" />
                            <p>{item.name}</p>
                            <p
                                className={`list-stock-pill ${getStockClassName(Number(item.stock ?? 20))}`}
                            >
                                {Number(item.stock ?? 20)}
                            </p>
                            <p>{item.category}</p>
                            <p>{item.price} vnđ</p>
                            {showActions ? (
                                <div
                                    className="list-actions-cell"
                                    ref={openMenuFoodId === item._id ? menuRef : undefined}
                                >
                                    <button
                                        type="button"
                                        className={`list-menu-trigger${openMenuFoodId === item._id ? ' is-open' : ''}`}
                                        aria-label="Open actions menu"
                                        aria-expanded={openMenuFoodId === item._id}
                                        onClick={() =>
                                            setOpenMenuFoodId((id) => (id === item._id ? null : item._id))
                                        }
                                        disabled={busyFoodId === item._id}
                                    >
                                        <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                                    </button>
                                    {openMenuFoodId === item._id ? (
                                        <ul className="list-action-menu" role="menu">
                                            {canUpdateFood ? (
                                                <li role="none">
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="list-action-menu-item"
                                                        onClick={() => openEditModal(item)}
                                                    >
                                                        Update
                                                    </button>
                                                </li>
                                            ) : null}
                                            {canDeleteFood ? (
                                                <li role="none">
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="list-action-menu-item list-action-menu-item--danger"
                                                        onClick={() => {
                                                            setOpenMenuFoodId(null)
                                                            setDeleteTarget({ id: item._id, name: item.name })
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </li>
                                            ) : null}
                                        </ul>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </div>

            {editingFood ? (
                <div className="list-modal-overlay" role="presentation" onClick={closeEditModal}>
                    <div
                        className="list-modal list-modal--edit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="list-edit-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="list-modal-header">
                            <h4 id="list-edit-title">Update item</h4>
                            <p className="list-modal-hint">
                                Change details or upload a new image (optional).
                            </p>
                        </header>
                        <form onSubmit={handleEditSubmit} className="list-modal-form">
                            <div className="list-modal-edit-grid">
                                <div className="list-modal-edit-media">
                                    <p className="list-modal-section-title">Image</p>
                                    <div className="list-modal-preview">
                                        <img
                                            src={editPreviewUrl || `${url}/images/${editingFood.image}`}
                                            alt=""
                                        />
                                    </div>
                                    <label className="list-modal-label list-modal-label--file">
                                        <span className="list-modal-file-label">Replace image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="list-modal-file"
                                            onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                                <div className="list-modal-edit-fields">
                                    <label className="list-modal-label">
                                        Name
                                        <input
                                            className="list-modal-input"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            required
                                        />
                                    </label>
                                    <label className="list-modal-label">
                                        Description
                                        <textarea
                                            className="list-modal-textarea"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={5}
                                            required
                                        />
                                    </label>
                                    <p className="list-modal-section-title list-modal-section-title--inline">
                                        Pricing & inventory
                                    </p>
                                    <div className="list-modal-row">
                                        <label className="list-modal-label">
                                            Category
                                            <select
                                                className="list-modal-input"
                                                value={editCategory}
                                                onChange={(e) => setEditCategory(e.target.value)}
                                            >
                                                {CATEGORIES.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="list-modal-label">
                                            Price (vnđ)
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="list-modal-input"
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <label className="list-modal-label">
                                            Quantity
                                            <input
                                                type="number"
                                                min="0"
                                                className="list-modal-input"
                                                value={editStock}
                                                onChange={(e) => setEditStock(e.target.value)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="list-modal-actions">
                                <button
                                    type="button"
                                    className="list-modal-btn secondary"
                                    onClick={closeEditModal}
                                    disabled={editSubmitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="list-modal-btn primary" disabled={editSubmitting}>
                                    {editSubmitting ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteTarget ? (
                <div
                    className="list-modal-overlay"
                    role="presentation"
                    onClick={() => !busyFoodId && setDeleteTarget(null)}
                >
                    <div
                        className="list-modal list-delete-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="list-delete-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 id="list-delete-title">Delete item?</h4>
                        <p className="list-modal-hint">
                            Remove <strong>{deleteTarget.name}</strong>? This cannot be undone.
                        </p>
                        <div className="list-modal-actions">
                            <button
                                type="button"
                                className="list-modal-btn secondary"
                                onClick={() => setDeleteTarget(null)}
                                disabled={Boolean(busyFoodId)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="list-modal-btn danger"
                                onClick={confirmDelete}
                                disabled={Boolean(busyFoodId)}
                            >
                                {busyFoodId ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {!isLoading && filteredList.length > 0 && (
                <div className="list-pagination">
                    <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    <div className="list-pagination-numbers">
                        {Array.from({ length: totalPages }).map((_, index) => {
                            const pageNumber = index + 1
                            return (
                                <button
                                    type="button"
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
                        type="button"
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

export default List
