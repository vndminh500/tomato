import React, { useEffect, useState } from 'react'
import './Users.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Users = ({ url }) => {
    const [users, setUsers] = useState([])

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${url}/api/user/list`)
            if (response.data.success) {
                setUsers(response.data.data)
            } else {
                toast.error('Không tải được danh sách người dùng')
            }
        } catch {
            toast.error('Lỗi kết nối')
        }
    }

    const statusHandler = async (e, userId) => {
        const isActive = e.target.value === 'active'
        try {
            const response = await axios.post(`${url}/api/user/status`, {
                userId,
                isActive
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
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    return (
        <div className="users add">
            <h3>Danh sách người dùng</h3>
            <div className="users-list-table title">
                <b>ID</b>
                <b>User Name</b>
                <b>Email</b>
                <b>Status</b>
            </div>
            {users.map((item) => (
                <div key={item._id} className="users-list-table">
                    <p>{item._id}</p>
                    <p>{item.name}</p>
                    <p>{item.email}</p>
                    <select
                        className={`users-status-select ${item.isActive ? 'users-status-select--active' : 'users-status-select--inactive'}`}
                        value={item.isActive ? 'active' : 'inactive'}
                        onChange={(e) => statusHandler(e, item._id)}
                    >
                        <option value="active">Actived</option>
                        <option value="inactive">Stop activated</option>
                    </select>
                </div>
            ))}
        </div>
    )
}

export default Users
