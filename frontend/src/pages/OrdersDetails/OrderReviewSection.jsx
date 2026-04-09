import React, { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"
import "./OrderReviewSection.css"

const QUICK_TAGS = [
    "Hot & fresh food",
    "Fast delivery",
    "Secure packaging",
    "Taste a bit bland",
    "Polite staff / driver",
    "Great value",
    "Would order again",
    "Portion size good",
    "Packaging could be better"
]

const MAX_FILES = 6
const MAX_BYTES = 8 * 1024 * 1024
const SUPPORT_PHONE = "+84 768 519 155"
const SUPPORT_EMAIL = "cskh_potato@gmail.com"
const ZALO_URL = "https://zalo.me/0768519155"

const STAR_LABELS = {
    1: "Very bad",
    2: "Bad",
    3: "Average",
    4: "Good",
    5: "Excellent"
}

const isVideoUrl = (src) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src)

function StarRow({ label, value, onChange, optional }) {
    const hasValue = value != null && value >= 1
    return (
        <div className="order-review-stars-row">
            <span className="order-review-stars-label">
                {label}
                {optional ? <span className="order-review-optional"> (optional)</span> : null}
            </span>
            <div className="order-review-stars" role="group" aria-label={label}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="order-review-star-wrap" data-hint={`${n} — ${STAR_LABELS[n]}`}>
                        <button
                            type="button"
                            className={`order-review-star ${hasValue && value >= n ? "is-on" : ""}`}
                            onClick={() => onChange(n)}
                            aria-label={`${n} star${n > 1 ? "s" : ""}: ${STAR_LABELS[n]}`}
                            title={`${STAR_LABELS[n]} (${n} star${n > 1 ? "s" : ""})`}
                        >
                            ★
                        </button>
                    </span>
                ))}
                {optional && hasValue ? (
                    <button type="button" className="order-review-star-clear" onClick={() => onChange(null)}>
                        Clear
                    </button>
                ) : null}
            </div>
        </div>
    )
}

export default function OrderReviewSection({ order, token, url }) {
    const [review, setReview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [itemsRating, setItemsRating] = useState(null)
    const [foodQ, setFoodQ] = useState(null)
    const [deliveryQ, setDeliveryQ] = useState(null)
    const [staffQ, setStaffQ] = useState(null)
    const [comment, setComment] = useState("")
    const [pickedTags, setPickedTags] = useState(() => new Set())
    const [files, setFiles] = useState([])
    const [reviewUnlocked, setReviewUnlocked] = useState(false)
    const [showSupportModal, setShowSupportModal] = useState(false)
    const [showLowRatingPrompt, setShowLowRatingPrompt] = useState(false)

    const fetchReview = useCallback(async () => {
        if (!token || !order?._id) {
            setReview(null)
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const res = await axios.get(`${url}/api/review/by-order/${order._id}`, {
                headers: { token }
            })
            if (res.data?.success) {
                setReview(res.data.data)
            } else {
                setReview(null)
            }
        } catch {
            setReview(null)
        } finally {
            setLoading(false)
        }
    }, [token, url, order?._id])

    useEffect(() => {
        fetchReview()
    }, [fetchReview])

    const orderItems = order?.items || []

    const toggleTag = (t) => {
        setPickedTags((prev) => {
            const n = new Set(prev)
            if (n.has(t)) n.delete(t)
            else n.add(t)
            return n
        })
    }

    const onFiles = (e) => {
        const picked = Array.from(e.target.files || [])
        const next = []
        for (const f of picked) {
            if (f.size > MAX_BYTES) {
                toast.error(`"${f.name}" exceeds 8MB`)
                continue
            }
            next.push(f)
            if (next.length >= MAX_FILES) break
        }
        setFiles(next)
        e.target.value = ""
    }

    const openChatSupport = () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("potato:open-chat"))
        }
    }

    const onItemsRatingChange = (n) => {
        setItemsRating(n)
        if (n <= 2) setShowLowRatingPrompt(true)
    }

    const submit = async (e) => {
        e.preventDefault()
        if (!token || !order?._id) return
        if (itemsRating == null || itemsRating < 1 || itemsRating > 5) {
            toast.error("Please rate the items you ordered (1–5 stars)")
            return
        }
        setSubmitting(true)
        try {
            const fd = new FormData()
            fd.append("orderId", String(order._id))
            fd.append("overallRating", String(itemsRating))
            if (foodQ) fd.append("foodQualityRating", String(foodQ))
            if (deliveryQ) fd.append("deliverySpeedRating", String(deliveryQ))
            if (staffQ) fd.append("staffAttitudeRating", String(staffQ))
            fd.append("comment", comment.trim())
            fd.append("isAnonymous", "false")
            fd.append("quickTags", JSON.stringify([...pickedTags]))
            const ir = orderItems
                .map((item) => ({
                    foodId: String(item._id || item.id || item.foodId || ""),
                    name: String(item.name || ""),
                    rating: itemsRating
                }))
                .filter((x) => x.foodId)
            fd.append("itemRatings", JSON.stringify(ir))
            files.forEach((f) => fd.append("media", f))

            const res = await axios.post(`${url}/api/review/create`, fd, { headers: { token } })
            if (res.data?.success) {
                toast.success(res.data.message || "Thank you for your review")
                setReview(res.data.data)
                setFiles([])
            } else {
                toast.error(res.data?.message || "Could not submit review")
            }
        } catch {
            toast.error("Connection error")
        } finally {
            setSubmitting(false)
        }
    }

    if (order?.status !== "Delivered") return null

    if (loading) {
        return (
            <section className="order-review-section" aria-busy="true">
                <h3 className="order-review-title">Review the order</h3>
                <p className="order-review-loading">Loading…</p>
            </section>
        )
    }

    if (review) {
        return (
            <section className="order-review-section order-review-section--submitted">
                <h3 className="order-review-title">Your review</h3>
                <div className="order-review-summary">
                    <div className="order-review-overall-display">
                        <span className="order-review-big-stars">{"★".repeat(review.overallRating)}{"☆".repeat(5 - review.overallRating)}</span>
                        <span className="order-review-overall-num">{review.overallRating}/5</span>
                        <span className="order-review-overall-caption">Items you ordered</span>
                    </div>
                    {review.foodQualityRating ? <p>Food quality: {review.foodQualityRating}/5</p> : null}
                    {review.deliverySpeedRating ? <p>Delivery speed: {review.deliverySpeedRating}/5</p> : null}
                    {review.staffAttitudeRating ? <p>Staff / driver: {review.staffAttitudeRating}/5</p> : null}
                    {review.quickTags?.length ? (
                        <div className="order-review-tags-read">
                            {review.quickTags.map((t) => (
                                <span key={t} className="order-review-tag-pill">
                                    {t}
                                </span>
                            ))}
                        </div>
                    ) : null}
                    {review.comment ? <p className="order-review-comment-read">{review.comment}</p> : null}
                    {review.media?.length ? (
                        <div className="order-review-media">
                            {review.media.map((src) =>
                                isVideoUrl(src) ? (
                                    <video key={src} src={src} className="order-review-media-item" controls playsInline />
                                ) : (
                                    <a key={src} href={src} target="_blank" rel="noreferrer">
                                        <img src={src} alt="" className="order-review-media-item" />
                                    </a>
                                )
                            )}
                        </div>
                    ) : null}
                    {review.merchantReply?.message ? (
                        <div className="order-review-merchant">
                            <h4>Restaurant reply</h4>
                            <p>{review.merchantReply.message}</p>
                            <span className="order-review-merchant-meta">
                                {review.merchantReply.authorRole || "Merchant"} ·{" "}
                                {review.merchantReply.createdAt ? new Date(review.merchantReply.createdAt).toLocaleString() : ""}
                            </span>
                        </div>
                    ) : (
                        <p className="order-review-pending-reply">The restaurant may reply to your review soon.</p>
                    )}
                </div>
            </section>
        )
    }

    return (
        <section className="order-review-section">
            <h3 className="order-review-title">Review the order</h3>
            <p className="order-review-intro">
                Share your experience to help other diners. Rate the items you ordered, add optional details, and attach
                photos or a short video. Your review is shown publicly with your name.
            </p>

            <div className={`order-review-gated${reviewUnlocked ? "" : " is-locked"}`}>
                <form className="order-review-form" onSubmit={submit}>
                    <div className="order-review-help-strip">
                        <p className="order-review-help-text">
                            If your order has an issue (cold food, missing items, spilled package), please contact support
                            first so we can assist you quickly.
                        </p>
                        <button type="button" className="order-review-help-btn" onClick={() => setShowSupportModal(true)}>
                            Contact support
                        </button>
                    </div>

                    <StarRow label="Items you ordered" value={itemsRating} onChange={onItemsRatingChange} />
                    <StarRow label="Food quality" value={foodQ} onChange={setFoodQ} optional />
                    <StarRow label="Delivery speed" value={deliveryQ} onChange={setDeliveryQ} optional />
                    <StarRow label="Staff / driver attitude" value={staffQ} onChange={setStaffQ} optional />

                    <div className="order-review-block">
                        <span className="order-review-block-title">Quick tags</span>
                        <div className="order-review-quick-tags">
                            {QUICK_TAGS.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`order-review-quick-tag ${pickedTags.has(t) ? "is-on" : ""}`}
                                    onClick={() => toggleTag(t)}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="order-review-label">
                        Comment
                        <textarea
                            className="order-review-textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="How was your meal and delivery?"
                            maxLength={5000}
                        />
                    </label>

                    <label className="order-review-label">
                        Photos or video (optional)
                        <span className="order-review-hint">Up to 6 files, 8MB each.</span>
                        <input type="file" accept="image/*,video/*" multiple className="order-review-file" onChange={onFiles} />
                    </label>
                    {files.length ? (
                        <div className="order-review-previews">
                            {files.map((f, i) => (
                                <span key={f.name + i} className="order-review-file-name">
                                    {f.name}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    <button type="submit" className="order-review-submit" disabled={submitting}>
                        {submitting ? "Submitting…" : "Submit review"}
                    </button>
                </form>

                {!reviewUnlocked ? (
                    <div className="order-review-overlay" role="dialog" aria-modal="true" aria-label="Review confirmation">
                        <div className="order-review-overlay-card">
                            <h4>Before you rate</h4>
                            <p>
                                If you are not satisfied with the product, please do not rush to give a 1-star rating.
                                Instead, contact us immediately via Phone: {SUPPORT_PHONE} or Email: {SUPPORT_EMAIL} for the
                                best possible assistance!
                            </p>
                            <div className="order-review-overlay-actions">
                                <button type="button" className="order-review-outline-btn" onClick={() => setShowSupportModal(true)}>
                                    Contact support
                                </button>
                                <button type="button" className="order-review-primary-btn" onClick={() => setReviewUnlocked(true)}>
                                    I understand, continue
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {showLowRatingPrompt ? (
                <div className="order-review-modal-backdrop" role="presentation" onClick={() => setShowLowRatingPrompt(false)}>
                    <div className="order-review-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h4>Need quick help?</h4>
                        <p>
                            We are sorry about your experience. Do you want to message the restaurant right now to report the
                            issue?
                        </p>
                        <div className="order-review-modal-actions">
                            <button type="button" className="order-review-outline-btn" onClick={() => setShowLowRatingPrompt(false)}>
                                Not now
                            </button>
                            <button
                                type="button"
                                className="order-review-primary-btn"
                                onClick={() => {
                                    setShowLowRatingPrompt(false)
                                    openChatSupport()
                                }}
                            >
                                Open chat
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {showSupportModal ? (
                <div className="order-review-modal-backdrop" role="presentation" onClick={() => setShowSupportModal(false)}>
                    <div className="order-review-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h4>Contact support</h4>
                        <p>Choose one method below:</p>
                        <div className="order-review-contact-actions">
                            <a href={ZALO_URL} target="_blank" rel="noreferrer" className="order-review-contact-btn">
                                <span className="order-review-contact-icon order-review-contact-icon--zalo" aria-hidden>
                                    Z
                                </span>
                                <span>Zalo</span>
                            </a>
                            <a
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="order-review-contact-btn"
                            >
                                <span className="order-review-contact-icon order-review-contact-icon--gmail" aria-hidden>
                                    ✉
                                </span>
                                <span>Gmail</span>
                            </a>
                        </div>
                        <button type="button" className="order-review-outline-btn order-review-contact-close" onClick={() => setShowSupportModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}
