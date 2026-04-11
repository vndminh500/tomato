import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './Users.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Users = ({
    url,
    token,
    currentUserId,
    canUpdateUserProfile = false,
    canCreateUser = false,
    canDeleteUser = false
}) => {
    const roleOptions = [
        { value: 'customer', label: 'Customer' },
        { value: 'staff', label: 'Staff' },
        { value: 'admin', label: 'Admin' }
    ]

    const showRowActions = canDeleteUser || canUpdateUserProfile
    const portalMenuRef = useRef(null)

    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [busyUserId, setBusyUserId] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [formName, setFormName] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formPassword, setFormPassword] = useState('')
    const [formConfirmPassword, setFormConfirmPassword] = useState('')
    const [formRole, setFormRole] = useState('staff')
    const [submitting, setSubmitting] = useState(false)
    const [createdPayload, setCreatedPayload] = useState(null)

    const [openMenuUserId, setOpenMenuUserId] = useState(null)
    const [menuScreenPos, setMenuScreenPos] = useState(null)
    const [editingUser, setEditingUser] = useState(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editRole, setEditRole] = useState('customer')
    const [editActive, setEditActive] = useState(true)
    const [editSubmitting, setEditSubmitting] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState(null)

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

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!openMenuUserId) return
            if (portalMenuRef.current?.contains(e.target)) return
            const trigger = e.target.closest('[data-users-menu-trigger]')
            if (trigger && trigger.dataset.userId === String(openMenuUserId)) return
            setOpenMenuUserId(null)
            setMenuScreenPos(null)
        }
        document.addEventListener('mousedown', onDocMouseDown)
        return () => document.removeEventListener('mousedown', onDocMouseDown)
    }, [openMenuUserId])

    useEffect(() => {
        if (!openMenuUserId) return
        const close = () => {
            setOpenMenuUserId(null)
            setMenuScreenPos(null)
        }
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [openMenuUserId])

    const openModal = () => {
        setFormName('')
        setFormEmail('')
        setFormPassword('')
        setFormConfirmPassword('')
        setFormRole('staff')
        setCreatedPayload(null)
        setModalOpen(true)
    }

    const closeModal = () => {
        if (submitting) return
        setModalOpen(false)
        setCreatedPayload(null)
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        if (!formName.trim() || !formEmail.trim()) {
            toast.error('Please fill name and email')
            return
        }
        const p = formPassword.trim()
        const c = formConfirmPassword.trim()
        if (p.length > 0 || c.length > 0) {
            if (!p || !c) {
                toast.error('Enter both password and confirm password')
                return
            }
            if (p !== c) {
                toast.error('Passwords do not match')
                return
            }
            if (p.length < 8) {
                toast.error('Password must be at least 8 characters')
                return
            }
        }
        try {
            setSubmitting(true)
            const payload = {
                name: formName.trim(),
                email: formEmail.trim(),
                role: formRole
            }
            if (p.length > 0) {
                payload.password = p
                payload.confirmPassword = c
            }
            const response = await axios.post(
                `${url}/api/user/admin-create`,
                payload,
                { headers: { token } }
            )
            if (response.data.success) {
                setCreatedPayload({
                    user: response.data.data,
                    temporaryPassword: response.data.temporaryPassword || null,
                    passwordSetByAdmin: Boolean(response.data.passwordSetByAdmin)
                })
                setUsers((prev) => {
                    const next = [...prev, response.data.data]
                    return next.sort((a, b) => String(a.email).localeCompare(String(b.email)))
                })
                toast.success('User created')
            } else {
                toast.error(response.data.message || 'Could not create user')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setSubmitting(false)
        }
    }

    const openEditModal = (item) => {
        setOpenMenuUserId(null)
        setMenuScreenPos(null)
        setEditingUser(item)
        setEditName(item.name || '')
        setEditEmail(item.email || '')
        setEditRole(item.role || 'customer')
        const isSelf = String(item._id) === String(currentUserId)
        setEditActive(isSelf ? true : item.isActive !== false)
    }

    const closeEditModal = () => {
        if (editSubmitting) return
        setEditingUser(null)
    }

    const handleEditSave = async (e) => {
        e.preventDefault()
        if (!editingUser) return
        if (!editName.trim()) {
            toast.error('User name is required')
            return
        }
        try {
            setEditSubmitting(true)
            const isSelf = String(editingUser._id) === String(currentUserId)
            const response = await axios.post(
                `${url}/api/user/admin-update`,
                {
                    targetUserId: editingUser._id,
                    name: editName.trim(),
                    email: editEmail.trim(),
                    role: editRole,
                    isActive: isSelf ? true : editActive
                },
                { headers: { token } }
            )
            if (response.data.success) {
                const u = response.data.data
                setUsers((prev) =>
                    prev.map((row) => (row._id === u._id ? { ...row, ...u } : row))
                )
                toast.success('User updated')
                setEditingUser(null)
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
        if (!deleteTarget || !canDeleteUser) return
        const { id, email } = deleteTarget
        if (String(id) === String(currentUserId)) {
            toast.error('You cannot delete your own account')
            setDeleteTarget(null)
            return
        }
        try {
            setBusyUserId(id)
            const response = await axios.post(
                `${url}/api/user/delete`,
                { targetUserId: id },
                { headers: { token } }
            )
            if (response.data.success) {
                setUsers((prev) => prev.filter((u) => u._id !== id))
                toast.success(response.data.message || 'User deleted')
            } else {
                toast.error(response.data.message || 'Delete failed')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setBusyUserId('')
            setDeleteTarget(null)
        }
    }

    const copyPassword = async () => {
        if (!createdPayload?.temporaryPassword) return
        try {
            await navigator.clipboard.writeText(createdPayload.temporaryPassword)
            toast.success('Password copied')
        } catch {
            toast.error('Could not copy')
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const menuOpenUser = useMemo(
        () => users.find((u) => String(u._id) === String(openMenuUserId)),
        [users, openMenuUserId]
    )

    return (
        <div className={`users${showRowActions ? ' users--with-actions' : ''}`}>
            <div className="users-page-header">
                <h3>List Users</h3>
                {canCreateUser ? (
                    <button type="button" className="users-add-btn" onClick={openModal}>
                        Add new user
                    </button>
                ) : null}
            </div>

            {modalOpen ? (
                <div className="users-modal-overlay" role="presentation" onClick={closeModal}>
                    <div
                        className="users-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="users-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!createdPayload ? (
                            <>
                                <h4 id="users-modal-title">Add new user</h4>
                                <p className="users-modal-hint">
                                    Set a password below, or leave both fields empty to generate a one-time password after creation.
                                </p>
                                <form onSubmit={handleCreateUser} className="users-modal-form">
                                    <label className="users-modal-label">
                                        User name
                                        <input
                                            type="text"
                                            className="users-modal-input"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            autoComplete="name"
                                            required
                                        />
                                    </label>
                                    <label className="users-modal-label">
                                        Email
                                        <input
                                            type="email"
                                            className="users-modal-input"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            autoComplete="email"
                                            required
                                        />
                                    </label>
                                    <label className="users-modal-label">
                                        Password <span className="users-modal-optional">(optional)</span>
                                        <input
                                            type="password"
                                            className="users-modal-input"
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            autoComplete="new-password"
                                            placeholder="Min. 8 characters if set"
                                        />
                                    </label>
                                    <label className="users-modal-label">
                                        Confirm password
                                        <input
                                            type="password"
                                            className="users-modal-input"
                                            value={formConfirmPassword}
                                            onChange={(e) => setFormConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </label>
                                    <label className="users-modal-label">
                                        Role
                                        <select
                                            className="users-modal-input users-modal-select"
                                            value={formRole}
                                            onChange={(e) => setFormRole(e.target.value)}
                                        >
                                            {roleOptions.map((roleOption) => (
                                                <option key={roleOption.value} value={roleOption.value}>
                                                    {roleOption.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="users-modal-actions">
                                        <button type="button" className="users-modal-btn secondary" onClick={closeModal} disabled={submitting}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="users-modal-btn primary" disabled={submitting}>
                                            {submitting ? 'Creating…' : 'Create user'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : createdPayload.temporaryPassword ? (
                            <>
                                <h4 id="users-modal-title">User created</h4>
                                <p className="users-modal-success-line">
                                    <strong>{createdPayload.user.email}</strong> can sign in with this temporary password:
                                </p>
                                <div className="users-modal-password-row">
                                    <code className="users-modal-password">{createdPayload.temporaryPassword}</code>
                                    <button type="button" className="users-modal-btn primary" onClick={copyPassword}>
                                        Copy
                                    </button>
                                </div>
                                <p className="users-modal-warning">Save this password now. It will not be shown again.</p>
                                <div className="users-modal-actions">
                                    <button
                                        type="button"
                                        className="users-modal-btn primary"
                                        onClick={() => {
                                            setModalOpen(false)
                                            setCreatedPayload(null)
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h4 id="users-modal-title">User created</h4>
                                <p className="users-modal-success-line">
                                    <strong>{createdPayload.user.email}</strong> can sign in with the password you set.
                                </p>
                                <div className="users-modal-actions">
                                    <button
                                        type="button"
                                        className="users-modal-btn primary"
                                        onClick={() => {
                                            setModalOpen(false)
                                            setCreatedPayload(null)
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : null}

            {editingUser ? (
                <div
                    className="users-modal-overlay users-modal-overlay--edit"
                    role="presentation"
                    onClick={closeEditModal}
                >
                    <div
                        className="users-modal users-modal--edit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="users-edit-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="users-edit-accent" aria-hidden="true" />
                        <header className="users-edit-header">
                            <div className="users-edit-avatar" aria-hidden="true">
                                {(editName || editingUser.name || '?').trim().charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="users-edit-header-copy">
                                <span className="users-edit-kicker">User profile</span>
                                <h4 id="users-edit-title">Update user</h4>
                                <p className="users-edit-subtitle">
                                    Adjust name, email, role, and whether the account can sign in.
                                </p>
                            </div>
                        </header>
                        <form onSubmit={handleEditSave} className="users-modal-form users-edit-form">
                            <div className="users-edit-fields">
                                <label className="users-modal-label users-edit-label">
                                    <span className="users-edit-label-text">Display name</span>
                                    <input
                                        type="text"
                                        className="users-modal-input users-edit-input"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Full name"
                                        required
                                    />
                                </label>
                                <label className="users-modal-label users-edit-label">
                                    <span className="users-edit-label-text">Email address</span>
                                    <input
                                        type="email"
                                        className="users-modal-input users-edit-input"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        required
                                    />
                                </label>
                                <label className="users-modal-label users-edit-label users-edit-label--role">
                                    <span className="users-edit-label-text">Role</span>
                                    <select
                                        className="users-modal-input users-modal-select users-edit-input"
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                    >
                                        {roleOptions.map((roleOption) => (
                                            <option key={roleOption.value} value={roleOption.value}>
                                                {roleOption.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div
                                className={`users-edit-toggle${String(editingUser._id) === String(currentUserId) ? ' users-edit-toggle--locked' : ''}`}
                            >
                                <div className="users-edit-toggle-copy">
                                    <span className="users-edit-toggle-title">Account active</span>
                                    <span className="users-edit-toggle-hint">
                                        {String(editingUser._id) === String(currentUserId)
                                            ? 'Your own account stays active while you are signed in.'
                                            : 'Inactive users cannot log in until re-enabled.'}
                                    </span>
                                </div>
                                <label className="users-edit-switch">
                                    <input
                                        type="checkbox"
                                        className="users-edit-switch-input"
                                        checked={
                                            String(editingUser._id) === String(currentUserId) ? true : editActive
                                        }
                                        onChange={(e) => {
                                            if (String(editingUser._id) === String(currentUserId)) return
                                            setEditActive(e.target.checked)
                                        }}
                                        disabled={String(editingUser._id) === String(currentUserId)}
                                    />
                                    <span className="users-edit-switch-ui" aria-hidden="true" />
                                </label>
                            </div>
                            <footer className="users-edit-footer">
                                <button
                                    type="button"
                                    className="users-modal-btn secondary users-edit-btn-cancel"
                                    onClick={closeEditModal}
                                    disabled={editSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="users-modal-btn primary users-edit-btn-save"
                                    disabled={editSubmitting}
                                >
                                    {editSubmitting ? 'Saving…' : 'Save changes'}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            ) : null}

            {deleteTarget ? (
                <div className="users-modal-overlay" role="presentation" onClick={() => !busyUserId && setDeleteTarget(null)}>
                    <div
                        className="users-modal users-delete-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="users-delete-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 id="users-delete-title">Delete user?</h4>
                        <p className="users-modal-success-line">
                            Remove <strong>{deleteTarget.email}</strong>? This cannot be undone.
                        </p>
                        <div className="users-modal-actions">
                            <button
                                type="button"
                                className="users-modal-btn secondary"
                                onClick={() => setDeleteTarget(null)}
                                disabled={Boolean(busyUserId)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="users-modal-btn users-modal-btn--danger"
                                onClick={confirmDelete}
                                disabled={Boolean(busyUserId)}
                            >
                                {busyUserId ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="users-table-scroll">
                <div className="users-list-table title">
                    <b>ID</b>
                    <b>User Name</b>
                    <b>Email</b>
                    <b>Status</b>
                    <b>Role</b>
                    {showRowActions ? <b>Actions</b> : null}
                </div>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="users-list-table users-skeleton-row">
                            <span className="users-skeleton-line short"></span>
                            <span className="users-skeleton-line"></span>
                            <span className="users-skeleton-line"></span>
                            <span className="users-skeleton-pill"></span>
                            <span className="users-skeleton-pill"></span>
                            {showRowActions ? <span className="users-skeleton-pill" /> : null}
                        </div>
                    ))
                ) : users.length === 0 ? (
                    <div className="users-empty-state">
                        <p>No users found.</p>
                        <span>Users will appear here after they register.</span>
                    </div>
                ) : (
                    users.map((item) => (
                        <div
                            key={item._id}
                            className={`users-list-table${String(openMenuUserId) === String(item._id) ? ' users-list-table--menu-open' : ''}`}
                        >
                            <p>{item._id}</p>
                            <p>{item.name}</p>
                            <p>{item.email}</p>
                            <div className="users-status-cell users-status-cell--readonly">
                                <span className={`users-status-badge ${item.isActive ? 'is-active' : 'is-inactive'}`}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="users-role-text">{roleOptions.find((r) => r.value === (item.role || 'customer'))?.label || 'Customer'}</p>
                            {showRowActions ? (
                                <div className="users-actions-cell">
                                    <button
                                        type="button"
                                        className={`users-menu-trigger${String(openMenuUserId) === String(item._id) ? ' is-open' : ''}`}
                                        data-users-menu-trigger
                                        data-user-id={item._id}
                                        aria-label="Open actions menu"
                                        aria-expanded={String(openMenuUserId) === String(item._id)}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (String(openMenuUserId) === String(item._id)) {
                                                setOpenMenuUserId(null)
                                                setMenuScreenPos(null)
                                                return
                                            }
                                            const rect = e.currentTarget.getBoundingClientRect()
                                            setOpenMenuUserId(item._id)
                                            setMenuScreenPos({
                                                top: rect.bottom + 6,
                                                right: window.innerWidth - rect.right
                                            })
                                        }}
                                        disabled={busyUserId === item._id}
                                    >
                                        <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ))
                )}
            </div>

            {showRowActions &&
                openMenuUserId &&
                menuScreenPos &&
                menuOpenUser &&
                createPortal(
                    <ul
                        ref={portalMenuRef}
                        className="users-action-menu users-action-menu--portal"
                        style={{ top: menuScreenPos.top, right: menuScreenPos.right }}
                        role="menu"
                    >
                        {canUpdateUserProfile ? (
                            <li role="none">
                                <button
                                    type="button"
                                    role="menuitem"
                                    className="users-action-menu-item"
                                    onClick={() => openEditModal(menuOpenUser)}
                                >
                                    Update
                                </button>
                            </li>
                        ) : null}
                        {canDeleteUser ? (
                            <li role="none">
                                <button
                                    type="button"
                                    role="menuitem"
                                    className="users-action-menu-item users-action-menu-item--danger"
                                    disabled={String(menuOpenUser._id) === String(currentUserId)}
                                    onClick={() => {
                                        setOpenMenuUserId(null)
                                        setMenuScreenPos(null)
                                        if (String(menuOpenUser._id) === String(currentUserId)) {
                                            toast.error('You cannot delete your own account')
                                            return
                                        }
                                        setDeleteTarget({ id: menuOpenUser._id, email: menuOpenUser.email })
                                    }}
                                >
                                    Delete
                                </button>
                            </li>
                        ) : null}
                    </ul>,
                    document.body
                )}
        </div>
    )
}

export default Users
