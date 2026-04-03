import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSearchParams } from 'react-router-dom'
import './Complaints.css'

const TYPE_LABELS = {
    staff_quality: 'Staff quality',
    food_issues: 'Food issues',
    payment: 'Payment',
    other: 'Other'
}

const COMPLAINT_TYPE_FILTER_ORDER = ['staff_quality', 'food_issues', 'payment', 'other']

const STATUS_OPTIONS = ['in_progress', 'approved', 'rejected', 'resolved']

const CAN_SEND_STATUSES = new Set(['approved', 'rejected', 'resolved'])

const STATUS_LABELS = {
    in_progress: 'In progress',
    appeal_pending: 'Appeal in review',
    approved: 'Approved',
    rejected: 'Rejected',
    resolved: 'Resolved',
    open: 'In progress',
    in_review: 'In progress',
    need_info: 'In progress'
}

const normalizeStatus = (s) => {
    if (s === 'open' || s === 'in_review' || s === 'need_info') return 'in_progress'
    return s
}

const formatDate = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return '—'
    }
}

const isVideoUrl = (src) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)

const EvidenceThumb = ({ src, onImageOpen }) =>
    isVideoUrl(src) ? (
        <video src={src} className='complaints-evidence-video' controls muted playsInline />
    ) : (
        <button type='button' className='complaints-evidence-thumb-btn' onClick={() => onImageOpen(src)}>
            <img src={src} alt='Evidence' />
        </button>
    )

const Complaints = ({ url, token, canResolve = false }) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState('')
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [statusDraft, setStatusDraft] = useState('in_progress')
    const [replyDraft, setReplyDraft] = useState('')
    const [saving, setSaving] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState(null)
    const [typeFilter, setTypeFilter] = useState('all')

    const fetchList = useCallback(async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${url}/api/complaint/admin/list`, { headers: { token } })
            if (res.data?.success) {
                setList(res.data.data || [])
            } else {
                toast.error(res.data?.message || 'Unable to load complaints')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setLoading(false)
        }
    }, [url, token])

    const fetchDetail = useCallback(
        async (id) => {
            if (!id) return
            try {
                setDetailLoading(true)
                const res = await axios.get(`${url}/api/complaint/admin/${id}`, { headers: { token } })
                if (res.data?.success) {
                    const d = res.data.data
                    setDetail(d)
                    const n = normalizeStatus(d.status || 'in_progress')
                    setStatusDraft(n === 'appeal_pending' ? '' : n)
                    setReplyDraft('')
                } else {
                    toast.error(res.data?.message || 'Unable to load complaint')
                }
            } catch {
                toast.error('Connection error')
            } finally {
                setDetailLoading(false)
            }
        },
        [url, token]
    )

    useEffect(() => {
        fetchList()
    }, [fetchList])

    useEffect(() => {
        const fromQuery = searchParams.get('complaintId')
        if (fromQuery) {
            setSelectedId(fromQuery)
        }
    }, [searchParams])

    useEffect(() => {
        if (selectedId) {
            fetchDetail(selectedId)
        } else {
            setDetail(null)
        }
    }, [selectedId, fetchDetail])

    useEffect(() => {
        setLightboxSrc(null)
    }, [selectedId])

    useEffect(() => {
        if (!lightboxSrc) return
        const onKey = (e) => {
            if (e.key === 'Escape') setLightboxSrc(null)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [lightboxSrc])

    const filteredList = useMemo(() => {
        if (typeFilter === 'all') return list
        return list.filter((row) => row.type === typeFilter)
    }, [list, typeFilter])

    useEffect(() => {
        if (!selectedId || typeFilter === 'all') return
        const stillVisible = filteredList.some((r) => String(r._id) === String(selectedId))
        if (!stillVisible) {
            setSelectedId('')
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                next.delete('complaintId')
                return next
            })
        }
    }, [typeFilter, filteredList, selectedId, setSearchParams])

    const selectRow = (id) => {
        setSelectedId(String(id))
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('complaintId', String(id))
            return next
        })
    }

    const sendBlockedByStatus = !CAN_SEND_STATUSES.has(statusDraft)

    const handleSend = async () => {
        if (!detail?._id || !canResolve || sendBlockedByStatus) return
        const reply = replyDraft.trim()
        if (!reply) {
            toast.error('Reply to customer is required')
            return
        }
        try {
            setSaving(true)
            const res = await axios.patch(
                `${url}/api/complaint/admin/${detail._id}`,
                { status: statusDraft, adminReply: reply },
                { headers: { token } }
            )
            if (res.data?.success) {
                toast.success('Response sent successfully')
                const d = res.data.data
                setDetail(d)
                setStatusDraft(normalizeStatus(d.status))
                setReplyDraft('')
                await fetchList()
            } else {
                toast.error(res.data?.message || 'Update failed')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setSaving(false)
        }
    }

    const statusLabel = (s) => STATUS_LABELS[s] || String(s).replace(/_/g, ' ')

    const detailNorm = detail ? normalizeStatus(detail.status) : ''
    const isAppealQueue = detailNorm === 'appeal_pending'
    const statusSelectOptions = isAppealQueue
        ? ['approved', 'rejected', 'resolved']
        : STATUS_OPTIONS

    return (
        <div className='complaints-page'>
            <div className='complaints-page-head'>
                <h3>Customer complaints</h3>
                <div className='complaints-type-filter'>
                    <label htmlFor='complaints-type-filter'>Complaint type</label>
                    <select
                        id='complaints-type-filter'
                        className='complaints-type-filter-select'
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value='all'>All types</option>
                        {COMPLAINT_TYPE_FILTER_ORDER.map((key) => (
                            <option key={key} value={key}>
                                {TYPE_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className='complaints-layout'>
                <div className='complaints-list-panel'>
                    {loading ? (
                        <p style={{ padding: 16 }}>Loading…</p>
                    ) : list.length === 0 ? (
                        <p style={{ padding: 16 }}>No complaints yet.</p>
                    ) : filteredList.length === 0 ? (
                        <p style={{ padding: 16 }}>No complaints match this type.</p>
                    ) : (
                        filteredList.map((row) => (
                            <button
                                key={row._id}
                                type='button'
                                className={`complaints-list-row ${selectedId === row._id ? 'is-active' : ''}`}
                                onClick={() => selectRow(row._id)}
                            >
                                <div>
                                    <div className='complaints-row-ticket'>{row.ticketNumber}</div>
                                    <div className='complaints-row-meta'>
                                        Order <code>{String(row.orderId).slice(-8)}</code>
                                        {' · '}
                                        <span className='complaints-type-label'>{TYPE_LABELS[row.type] || row.type}</span>
                                    </div>
                                    <div className='complaints-row-line2'>
                                        <span>Customer ID: {String(row.userId).slice(-8)}</span>
                                        {' · '}
                                        <span>{row.customerName || '—'}</span>
                                    </div>
                                    <div className='complaints-row-line2'>{formatDate(row.createdAt)}</div>
                                </div>
                                <span className={`complaints-status-pill ${normalizeStatus(row.status)}`}>
                                    {statusLabel(normalizeStatus(row.status))}
                                </span>
                            </button>
                        ))
                    )}
                </div>
                <div className='complaints-detail-panel'>
                    {!selectedId ? (
                        <p className='complaints-detail-empty'>Select a complaint to view full details.</p>
                    ) : detailLoading ? (
                        <p className='complaints-detail-empty'>Loading details…</p>
                    ) : !detail ? (
                        <p className='complaints-detail-empty'>Could not load this complaint.</p>
                    ) : (
                        <>
                            <div className='complaints-detail-top'>
                                <h4 className='complaints-detail-section-title'>Complaint details</h4>
                                <div className='complaints-detail-section'>
                                    <h4>Ticket</h4>
                                    <p>
                                        <strong>{detail.ticketNumber}</strong>
                                    </p>
                                </div>
                                <div className='complaints-detail-grid'>
                                    <div className='complaints-detail-section'>
                                        <h4>Order ID</h4>
                                        <p style={{ wordBreak: 'break-all' }}>{detail.orderId}</p>
                                    </div>
                                    <div className='complaints-detail-section'>
                                        <h4>Customer user ID</h4>
                                        <p style={{ wordBreak: 'break-all' }}>{detail.userId || '—'}</p>
                                    </div>
                                    <div className='complaints-detail-section'>
                                        <h4>Type</h4>
                                        <p className='complaints-type-label'>{TYPE_LABELS[detail.type] || detail.type}</p>
                                    </div>
                                    <div className='complaints-detail-section'>
                                        <h4>Phone number</h4>
                                        <p>{detail.contactPhone || '—'}</p>
                                    </div>
                                    <div className='complaints-detail-section'>
                                        <h4>Email</h4>
                                        <p style={{ wordBreak: 'break-all' }}>{detail.contactEmail || '—'}</p>
                                    </div>
                                    <div className='complaints-detail-section'>
                                        <h4>Submitted</h4>
                                        <p>{formatDate(detail.createdAt)}</p>
                                    </div>
                                </div>
                                <div className='complaints-detail-section'>
                                    <h4>Description</h4>
                                    <p>{detail.description}</p>
                                </div>
                                {detail.images?.length > 0 ? (
                                    <div className='complaints-detail-section'>
                                        <h4>Images or evidence</h4>
                                        <div className='complaints-images'>
                                            {detail.images.map((src) => (
                                                <EvidenceThumb key={src} src={src} onImageOpen={setLightboxSrc} />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {detail.appeal?.message ? (
                                    <div className='complaints-detail-section complaints-appeal-box'>
                                        <h4>Customer appeal</h4>
                                        <p>{detail.appeal.message}</p>
                                        {detail.appeal.images?.length > 0 ? (
                                            <div className='complaints-images'>
                                                {detail.appeal.images.map((src) => (
                                                    <EvidenceThumb key={src} src={src} onImageOpen={setLightboxSrc} />
                                                ))}
                                            </div>
                                        ) : null}
                                        <p className='complaints-appeal-date'>
                                            Submitted {formatDate(detail.appeal.submittedAt)}
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            <div className='complaints-detail-bottom'>
                                <h4 className='complaints-detail-section-title'>Response</h4>
                                <div className='complaints-detail-section'>
                                    <h4>Response history</h4>
                                    {detail.responses?.length ? (
                                        <ul className='complaints-responses'>
                                            {detail.responses.map((r) => (
                                                <li key={r._id || `${r.createdAt}-${r.message?.slice(0, 20)}`}>
                                                    <div className='complaints-resp-meta'>
                                                        {r.authorRole || 'staff'} · {formatDate(r.createdAt)}
                                                    </div>
                                                    <div>{r.message}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className='complaints-detail-empty'>No responses yet.</p>
                                    )}
                                </div>
                                {canResolve ? (
                                    <div className='complaints-admin-form complaints-detail-section'>
                                        <label htmlFor='complaint-status'>Status</label>
                                        <select
                                            id='complaint-status'
                                            value={statusDraft}
                                            onChange={(e) => setStatusDraft(e.target.value)}
                                        >
                                            {isAppealQueue ? (
                                                <option value='' disabled>
                                                    Select outcome…
                                                </option>
                                            ) : null}
                                            {statusSelectOptions.map((s) => (
                                                <option key={s} value={s}>
                                                    {statusLabel(s)}
                                                </option>
                                            ))}
                                        </select>
                                        <label htmlFor='complaint-reply'>Reply to customer</label>
                                        <textarea
                                            id='complaint-reply'
                                            value={replyDraft}
                                            onChange={(e) => setReplyDraft(e.target.value)}
                                            placeholder='Your message visible to the customer…'
                                            required
                                        />
                                        <button
                                            type='button'
                                            className='complaints-save-btn'
                                            disabled={saving || sendBlockedByStatus}
                                            onClick={handleSend}
                                        >
                                            {saving ? 'Sending…' : 'Send'}
                                        </button>
                                        {sendBlockedByStatus && canResolve ? (
                                            <p className='complaints-send-hint'>
                                                {isAppealQueue
                                                    ? 'Choose Approved, Rejected, or Resolved for this appeal, then send.'
                                                    : 'Change status from In progress to Approved, Rejected, or Resolved before sending.'}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className='complaints-detail-empty' style={{ marginTop: 12 }}>
                                        You can view complaints but cannot change status or reply.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {lightboxSrc ? (
                <div
                    className='complaints-lightbox-overlay'
                    role='presentation'
                    onClick={() => setLightboxSrc(null)}
                >
                    <div
                        className='complaints-lightbox-dialog'
                        role='dialog'
                        aria-modal='true'
                        aria-label='Evidence preview'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type='button'
                            className='complaints-lightbox-close'
                            aria-label='Close'
                            onClick={() => setLightboxSrc(null)}
                        >
                            ×
                        </button>
                        <img src={lightboxSrc} alt='' className='complaints-lightbox-img' />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default Complaints
