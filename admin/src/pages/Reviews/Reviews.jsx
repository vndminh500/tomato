import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSearchParams } from 'react-router-dom'
import './Reviews.css'

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
        <video src={src} className='reviews-admin-video' controls muted playsInline />
    ) : (
        <button type='button' className='reviews-admin-thumb-btn' onClick={() => onImageOpen(src)}>
            <img src={src} alt='Review media' />
        </button>
    )

const starVisual = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

const Reviews = ({ url, token, canReply = false }) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [starsFilter, setStarsFilter] = useState('all')
    const [selectedOrderId, setSelectedOrderId] = useState('')
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [replyDraft, setReplyDraft] = useState('')
    const [saving, setSaving] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState(null)
    const lastDetailFetchKeyRef = useRef('')

    const fetchRows = useCallback(
        async (opts = {}) => {
            const silent = opts.silent === true
            try {
                if (!silent) setLoading(true)
                const res = await axios.get(`${url}/api/review/admin/delivered-overview`, { headers: { token } })
                if (res.data?.success) {
                    setRows(res.data.data || [])
                } else if (!silent) {
                    toast.error(res.data?.message || 'Unable to load reviews')
                }
            } catch {
                if (!silent) toast.error('Connection error')
            } finally {
                if (!silent) setLoading(false)
            }
        },
        [url, token]
    )

    useEffect(() => {
        fetchRows()
    }, [fetchRows])

    useEffect(() => {
        const id = setInterval(() => fetchRows({ silent: true }), 10000)
        return () => clearInterval(id)
    }, [fetchRows])

    useEffect(() => {
        const q = searchParams.get('reviewId')
        if (!q || !rows.length) return
        const row = rows.find((r) => r.review && String(r.review._id) === String(q))
        if (row) {
            setSelectedOrderId(String(row.order._id))
        }
    }, [searchParams, rows])

    const fetchDetail = useCallback(
        async (reviewId, options = {}) => {
            const preserveReplyDraft = options.preserveReplyDraft === true
            if (!reviewId) {
                setDetail(null)
                return
            }
            try {
                if (!preserveReplyDraft) setDetailLoading(true)
                const res = await axios.get(`${url}/api/review/admin/${reviewId}`, { headers: { token } })
                if (res.data?.success) {
                    setDetail(res.data.data)
                    if (!preserveReplyDraft) setReplyDraft('')
                } else {
                    toast.error(res.data?.message || 'Unable to load review')
                    setDetail(null)
                }
            } catch {
                toast.error('Connection error')
                setDetail(null)
            } finally {
                if (!preserveReplyDraft) setDetailLoading(false)
            }
        },
        [url, token]
    )

    useEffect(() => {
        if (!selectedOrderId) {
            setDetail(null)
            setDetailLoading(false)
            lastDetailFetchKeyRef.current = ''
            return
        }
        const row = rows.find((r) => String(r.order._id) === String(selectedOrderId))
        if (row?.review?._id) {
            const reviewId = String(row.review._id)
            const key = `${selectedOrderId}-${reviewId}`
            if (key === lastDetailFetchKeyRef.current) {
                fetchDetail(reviewId, { preserveReplyDraft: true })
                return
            }
            lastDetailFetchKeyRef.current = key
            setDetail(null)
            fetchDetail(reviewId, { preserveReplyDraft: false })
        } else {
            lastDetailFetchKeyRef.current = `pending-${selectedOrderId}`
            setDetailLoading(false)
            setDetail({
                placeholder: true,
                order: row?.order,
                customerName: row?.customerName,
                orderCustomerName: row?.orderCustomerName,
                orderCustomerPhone: row?.orderCustomerPhone
            })
        }
    }, [selectedOrderId, rows, fetchDetail])

    useEffect(() => {
        if (!selectedOrderId || !rows.length) return
        const row = rows.find((r) => String(r.order._id) === String(selectedOrderId))
        if (!row?.review?._id || !detail?.placeholder || detailLoading) return
        fetchDetail(row.review._id)
    }, [rows, selectedOrderId, detail?.placeholder, detailLoading, fetchDetail])

    useEffect(() => {
        setLightboxSrc(null)
    }, [selectedOrderId])

    useEffect(() => {
        if (!lightboxSrc) return
        const onKey = (e) => {
            if (e.key === 'Escape') setLightboxSrc(null)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [lightboxSrc])

    const filteredRows = useMemo(() => {
        let list = rows
        if (filter === 'reviewed') list = list.filter((r) => r.review)
        else if (filter === 'pending') list = list.filter((r) => !r.review)
        if (starsFilter !== 'all') {
            const n = Number(starsFilter)
            list = list.filter((r) => r.review && Number(r.review.overallRating) === n)
        }
        return list
    }, [rows, filter, starsFilter])

    const selectRow = (orderId, reviewId) => {
        setSelectedOrderId(String(orderId))
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (reviewId) next.set('reviewId', String(reviewId))
            else next.delete('reviewId')
            return next
        })
    }

    const handleReply = async () => {
        if (!detail?._id || detail.placeholder) return
        const msg = replyDraft.trim()
        if (!msg) {
            toast.error('Reply message is required')
            return
        }
        try {
            setSaving(true)
            const res = await axios.patch(
                `${url}/api/review/admin/${detail._id}/reply`,
                { message: msg },
                { headers: { token } }
            )
            if (res.data?.success) {
                toast.success('Reply published')
                setDetail((prev) => ({
                    ...prev,
                    ...res.data.data,
                    order: prev?.order,
                    customer: prev?.customer,
                    orderCustomerName: prev?.orderCustomerName,
                    orderCustomerPhone: prev?.orderCustomerPhone,
                    orderCustomerEmail: prev?.orderCustomerEmail
                }))
                setReplyDraft('')
                await fetchRows({ silent: true })
            } else {
                toast.error(res.data?.message || 'Failed to send reply')
            }
        } catch {
            toast.error('Connection error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='reviews-admin'>
            <header className='reviews-admin-hero'>
                <div className='reviews-admin-hero-inner'>
                    <div>
                        <h1 className='reviews-admin-title'>Ratings &amp; reviews</h1>
                        <p className='reviews-admin-subtitle'>
                            Delivered orders only. See star ratings, customer comments, and reply as the restaurant.
                        </p>
                    </div>
                    <div className='reviews-admin-filters-row'>
                        <div className='reviews-admin-filter'>
                            <label htmlFor='reviews-filter'>Filter list</label>
                            <select
                                id='reviews-filter'
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value='all'>All delivered orders</option>
                                <option value='reviewed'>Reviewed</option>
                                <option value='pending'>Not reviewed yet</option>
                            </select>
                        </div>
                        <div className='reviews-admin-filter'>
                            <label htmlFor='reviews-stars-filter'>Star rating</label>
                            <select
                                id='reviews-stars-filter'
                                value={starsFilter}
                                onChange={(e) => setStarsFilter(e.target.value)}
                            >
                                <option value='all'>All ratings (1–5)</option>
                                <option value='5'>5 stars</option>
                                <option value='4'>4 stars</option>
                                <option value='3'>3 stars</option>
                                <option value='2'>2 stars</option>
                                <option value='1'>1 star</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <div className='reviews-admin-layout'>
                <div className='reviews-admin-list'>
                    {loading ? (
                        <p>Loading…</p>
                    ) : filteredRows.length === 0 ? (
                        <p>No orders match this filter.</p>
                    ) : (
                        filteredRows.map((row) => {
                            const oid = String(row.order._id)
                            const active = selectedOrderId === oid
                            return (
                                <button
                                    key={oid}
                                    type='button'
                                    className={`reviews-admin-row ${active ? 'is-active' : ''}`}
                                    onClick={() => selectRow(oid, row.review?._id)}
                                >
                                    <div className='reviews-admin-row-main'>
                                        <div className='reviews-admin-row-order'>
                                            Order <code>{oid.slice(-8)}</code>
                                        </div>
                                        <div className='reviews-admin-row-meta'>
                                            {row.orderCustomerName || row.customerName || '—'}
                                            {row.orderCustomerPhone && row.orderCustomerPhone !== '—'
                                                ? ` · ${row.orderCustomerPhone}`
                                                : ''}{' '}
                                            · {formatDate(row.order.date)}
                                        </div>
                                        <div className='reviews-admin-row-sub'>
                                            {row.review ? (
                                                <>
                                                    <span className='reviews-admin-row-stars' aria-hidden>
                                                        {starVisual(row.review.overallRating)}
                                                    </span>
                                                    <span>{row.review.overallRating}/5</span>
                                                    <span>·</span>
                                                    <span>
                                                        {row.review.hasMerchantReply ? 'Replied' : 'Awaiting your reply'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span>No customer review yet</span>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`reviews-admin-pill ${row.review ? 'reviews-admin-pill--done' : 'reviews-admin-pill--wait'}`}
                                    >
                                        {row.review ? 'Reviewed' : 'Pending'}
                                    </span>
                                </button>
                            )
                        })
                    )}
                </div>

                <div className='reviews-admin-detail'>
                    {!selectedOrderId ? (
                        <p className='reviews-admin-detail-empty'>
                            Select a delivered order on the left to view the review and reply.
                        </p>
                    ) : detailLoading ? (
                        <p className='reviews-admin-detail-empty'>Loading…</p>
                    ) : !detail ? (
                        <p className='reviews-admin-detail-empty'>Could not load.</p>
                    ) : detail.placeholder ? (
                        <div className='reviews-admin-detail-body'>
                            <div className='reviews-admin-placeholder-card'>
                                <h4>No review yet</h4>
                                <p>
                                    This order was delivered, but the customer has not submitted a rating or comment.
                                </p>
                            </div>
                            <div className='reviews-admin-metric-grid'>
                                <div className='reviews-admin-metric'>
                                    <h5>Name (order)</h5>
                                    <p>{detail.orderCustomerName || detail.customerName || '—'}</p>
                                </div>
                                <div className='reviews-admin-metric'>
                                    <h5>Phone</h5>
                                    <p>{detail.orderCustomerPhone || '—'}</p>
                                </div>
                                <div className='reviews-admin-metric'>
                                    <h5>Order total</h5>
                                    <p>{detail.order?.amount} vnđ</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='reviews-admin-detail-body'>
                            <div className='reviews-admin-detail-split'>
                                <h2 className='reviews-admin-section-title'>Customer review</h2>
                                <div className='reviews-admin-score-hero'>
                                    <div>
                                        <div className='reviews-admin-score-big'>
                                            <span className='reviews-admin-score-num'>{detail.overallRating}</span>
                                            <span className='reviews-admin-score-max'>/5</span>
                                        </div>
                                        <div className='reviews-admin-score-stars' aria-hidden>
                                            {starVisual(detail.overallRating)}
                                        </div>
                                    </div>
                                </div>

                                <div className='reviews-admin-metric-grid'>
                                    <div className='reviews-admin-metric'>
                                        <h5>Customer name</h5>
                                        <p>{detail.orderCustomerName || detail.customer?.name || '—'}</p>
                                    </div>
                                    <div className='reviews-admin-metric'>
                                        <h5>Phone (order)</h5>
                                        <p>{detail.orderCustomerPhone || '—'}</p>
                                    </div>
                                    <div className='reviews-admin-metric'>
                                        <h5>Submitted</h5>
                                        <p>{formatDate(detail.createdAt)}</p>
                                    </div>
                                    <div className='reviews-admin-metric'>
                                        <h5>Order ID</h5>
                                        <p style={{ wordBreak: 'break-all', fontSize: 12 }}>{detail.orderId}</p>
                                    </div>
                                </div>

                                {(detail.foodQualityRating ||
                                    detail.deliverySpeedRating ||
                                    detail.staffAttitudeRating) ? (
                                    <div className='reviews-admin-criteria'>
                                        {detail.foodQualityRating ? (
                                            <span className='reviews-admin-criterion'>
                                                Food {detail.foodQualityRating}/5
                                            </span>
                                        ) : null}
                                        {detail.deliverySpeedRating ? (
                                            <span className='reviews-admin-criterion'>
                                                Delivery {detail.deliverySpeedRating}/5
                                            </span>
                                        ) : null}
                                        {detail.staffAttitudeRating ? (
                                            <span className='reviews-admin-criterion'>
                                                Staff {detail.staffAttitudeRating}/5
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}

                                {detail.itemRatings?.length ? (
                                    <div className='reviews-admin-block'>
                                        <h5>Per-item ratings</h5>
                                        <ul>
                                            {detail.itemRatings.map((it, i) => (
                                                <li key={i}>
                                                    {it.name || it.foodId}: {starVisual(it.rating)} {it.rating}/5
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {detail.quickTags?.length ? (
                                    <div className='reviews-admin-block'>
                                        <h5>Quick tags</h5>
                                        <div className='reviews-admin-tags'>
                                            {detail.quickTags.map((t) => (
                                                <span key={t} className='reviews-admin-tag'>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className='reviews-admin-block'>
                                    <h5>Comment</h5>
                                    <p>{detail.comment || '—'}</p>
                                </div>

                                {detail.media?.length ? (
                                    <div className='reviews-admin-block'>
                                        <h5>Photos / video</h5>
                                        <div className='reviews-admin-media'>
                                            {detail.media.map((src) => (
                                                <EvidenceThumb key={src} src={src} onImageOpen={setLightboxSrc} />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {detail.merchantReply?.message ? (
                                    <div className='reviews-admin-reply-public'>
                                        <h5>Published reply (customer sees this)</h5>
                                        <p>{detail.merchantReply.message}</p>
                                        <span className='reviews-admin-reply-meta'>
                                            {detail.merchantReply.authorRole || 'Merchant'} ·{' '}
                                            {formatDate(detail.merchantReply.createdAt)}
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <div>
                                <h2 className='reviews-admin-section-title'>Your reply</h2>
                                {canReply ? (
                                    <div className='reviews-admin-reply-form'>
                                        <label htmlFor='review-reply'>Message to customer</label>
                                        <textarea
                                            id='review-reply'
                                            value={replyDraft}
                                            onChange={(e) => setReplyDraft(e.target.value)}
                                            placeholder='Thank them or address their feedback…'
                                            rows={5}
                                        />
                                        <button
                                            type='button'
                                            className='reviews-admin-btn'
                                            disabled={saving}
                                            onClick={handleReply}
                                        >
                                            {saving ? 'Sending…' : detail.merchantReply ? 'Update reply' : 'Post reply'}
                                        </button>
                                        {detail.merchantReply ? (
                                            <p className='reviews-admin-hint'>
                                                Sending again replaces the reply shown to the customer.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className='reviews-admin-detail-empty' style={{ padding: '12px 0' }}>
                                        You can view reviews but cannot post replies.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {lightboxSrc ? (
                <div
                    className='reviews-lightbox-overlay'
                    role='presentation'
                    onClick={() => setLightboxSrc(null)}
                >
                    <div
                        className='reviews-lightbox-dialog'
                        role='dialog'
                        aria-modal='true'
                        aria-label='Media preview'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type='button'
                            className='reviews-lightbox-close'
                            aria-label='Close'
                            onClick={() => setLightboxSrc(null)}
                        >
                            ×
                        </button>
                        <img src={lightboxSrc} alt='' className='reviews-lightbox-img' />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default Reviews
