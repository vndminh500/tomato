import React, { useEffect, useState } from 'react'
import './Users.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Users = ({ url, token, canUpdateStatus = false, canUpdateRole = false }) => {
    const roleOptions = [
        { value: 'customer', label: 'Customer' },
        { value: 'staff', label: 'Staff' },
        { value: 'admin', label: 'Admin' },
        { value: 'super_admin', label: 'Super Admin' }
    ]

    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingUserId, setUpdatingUserId] = useState("")

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get(`${url}/api/user/list`, {
                headers: { token }
            })
            if (response.data.success) {
                setUsers(response.data.data)
            } else {
                toast.error('Unable to load user list')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setIsLoading(false)
        }
    }

    const statusHandler = async (e, userId) => {
        if (!canUpdateStatus) return
        const isActive = e.target.value === 'active'
        try {
            setUpdatingUserId(userId)
            const response = await axios.post(`${url}/api/user/status`, {
                targetUserId: userId,
                isActive
            }, {
                headers: { token }
            })
            if (response.data.success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u._id === userId ? { ...u, isActive: response.data.data.isActive } : u
                    )
                )
                toast.success('Status updated')
            } else {
                toast.error(response.data.message || 'Update failed')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setUpdatingUserId("")
        }
    }

    const roleHandler = async (e, userId) => {
        if (!canUpdateRole) return
        const role = e.target.value
        try {
            setUpdatingUserId(userId)
            const response = await axios.post(`${url}/api/user/role`, { targetUserId: userId, role }, {
                headers: { token }
            })
            if (response.data.success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u._id === userId ? { ...u, role: response.data.data.role } : u
                    )
                )
                toast.success('Role updated')
            } else {
                toast.error(response.data.message || 'Update role failed')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setUpdatingUserId("")
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    return (
        <div className="users add">
            <h3>List Users</h3>
            <div className="users-list-table title">
                <b>ID</b>
                <b>User Name</b>
                <b>Email</b>
                <b>Status</b>
                <b>Role</b>
            </div>
            {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="users-list-table users-skeleton-row">
                        <span className='users-skeleton-line short'></span>
                        <span className='users-skeleton-line'></span>
                        <span className='users-skeleton-line'></span>
                        <span className='users-skeleton-pill'></span>
                        <span className='users-skeleton-pill'></span>
                    </div>
                ))
            ) : users.length === 0 ? (
                <div className='users-empty-state'>
                    <p>No users found.</p>
                    <span>Users will appear here after they register.</span>
                </div>
            ) : users.map((item) => (
                <div key={item._id} className="users-list-table">
                    <p>{item._id}</p>
                    <p>{item.name}</p>
                    <p>{item.email}</p>
                    <div className='users-status-cell'>
                        <span className={`users-status-badge ${item.isActive ? 'is-active' : 'is-inactive'}`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <select
                            className={`users-status-select ${item.isActive ? 'users-status-select--active' : 'users-status-select--inactive'}`}
                            value={item.isActive ? 'active' : 'inactive'}
                            onChange={(e) => statusHandler(e, item._id)}
                            disabled={!canUpdateStatus || updatingUserId === item._id}
                        >
                            <option value="active">Activate</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <select
                        className='users-status-select users-role-select'
                        value={item.role || 'customer'}
                        onChange={(e) => roleHandler(e, item._id)}
                        disabled={!canUpdateRole || updatingUserId === item._id}
                    >
                        {roleOptions.map((roleOption) => (
                            <option key={roleOption.value} value={roleOption.value}>
                                {roleOption.label}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    )
}

export default Users
