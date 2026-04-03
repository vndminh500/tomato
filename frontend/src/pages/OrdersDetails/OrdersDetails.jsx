import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import './OrdersDetails.css';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { StoreContext } from '../../context/StoreContext';

const COMPLAINT_TYPES = [
    { value: 'staff_quality', label: 'Staff quality' },
    { value: 'food_issues', label: 'Food issues' },
    { value: 'payment', label: 'Payment' },
    { value: 'other', label: 'Other' }
];

/** Customer cannot act while staff has not yet replied (waiting states). */
const WAITING_CUSTOMER_STATUSES = new Set([
    'in_progress',
    'open',
    'in_review',
    'need_info'
]);

const STATUS_LABELS = {
    in_progress: 'In Progress',
    approved: 'Approved',
    rejected: 'Rejected',
    resolved: 'Resolved',
    appeal_pending: 'Appeal in review',
    open: 'In Progress',
    in_review: 'In Progress',
    need_info: 'In Progress'
};

const COMPLAINT_POLICY_TEXT = `1. Thời hạn tiếp nhận khiếu nại
Do đồ ăn có thể biến chất nhanh chóng, thời hạn khiếu nại cần ngắn hơn các loại hàng hóa khác:
• Chất lượng món ăn (ôi thiu, có vật thể lạ): Trong vòng 2 giờ kể từ khi đơn hàng được cập nhật trạng thái "Đã giao".
• Sai món, thiếu món: Trong vòng 1 giờ kể từ khi nhận hàng.
• Lỗi thanh toán (VNPay): Trong vòng 24 giờ kể từ khi phát sinh giao dịch.
• Không nhận được hàng: Trong vòng 30 phút sau thời gian dự kiến giao hàng.

2. Yêu cầu về bằng chứng (Evidence)
Để tránh tình trạng khách hàng khiếu nại ảo, hệ thống Tomato nên yêu cầu:
• Hình ảnh/Video: Phải có ảnh chụp thực tế món ăn, nhãn dán trên bao bì và hóa đơn (nếu có).
• Trạng thái sản phẩm: Sản phẩm khiếu nại về chất lượng phải còn ít nhất 80% lượng thức ăn ban đầu (để tránh trường hợp khách ăn hết rồi mới khiếu nại).

3. Quy trình xử lý và Phản hồi (SLA)
Để khách hàng yên tâm, Tomato cần cam kết:
• Thời gian phản hồi ban đầu: Trong vòng 15 - 30 phút (giờ cao điểm) hoặc 1 giờ (giờ thấp điểm).
• Thời gian ra quyết định cuối cùng: Không quá 24 giờ làm việc.
• Thời gian tiền về tài khoản (nếu hoàn tiền): Tùy thuộc vào cổng VNPay và ngân hàng (thường 3-7 ngày làm việc).

4. Chính sách Kháng nghị (Appeal Policy)
Như bạn đã thắc mắc, đây là phần dành cho khách hàng chưa ưng ý với kết quả Rejected:
• Khách hàng có 01 lần duy nhất để yêu cầu xem xét lại trong vòng 12 giờ sau khi nhận thông báo từ chối.
• Phải cung cấp thêm thông tin hoặc bằng chứng mới mà lần đầu chưa có.
• Quyết định sau khi kháng nghị bởi Quản lý cấp cao sẽ là quyết định cuối cùng và không thể thay đổi.

5. Chính sách chống gian lận (Anti-Fraud)
Để bảo vệ hệ thống Tomato khỏi những khách hàng "xấu":
• Giới hạn số lần khiếu nại: Nếu một tài khoản có tỷ lệ khiếu nại > 30% tổng số đơn hàng trong tháng, hệ thống sẽ tự động gắn cờ (Flag) để Admin kiểm tra kỹ hơn.
• Khóa tính năng: Nếu phát hiện bằng chứng giả mạo (ảnh mạng, ảnh cũ), Tomato có quyền khóa tài khoản khách hàng vĩnh viễn mà không cần báo trước`;

const typeLabel = (value) => COMPLAINT_TYPES.find((t) => t.value === value)?.label || value;

const formatWhen = (d) => {
    if (!d) return '';
    try {
        return new Date(d).toLocaleString();
    } catch {
        return '';
    }
};

const isVideoUrl = (src) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

const MAX_FILES = 5;
const MAX_BYTES = 2 * 1024 * 1024;

const OrdersDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { token, url } = useContext(StoreContext);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [complaintOpen, setComplaintOpen] = useState(false);
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [appealOpen, setAppealOpen] = useState(false);
    const [complaintPhase, setComplaintPhase] = useState('idle');
    const [ticket, setTicket] = useState(null);
    const [orderComplaintRow, setOrderComplaintRow] = useState(null);

    const [complaintType, setComplaintType] = useState('staff_quality');
    const [complaintDescription, setComplaintDescription] = useState('');
    const [complaintPhone, setComplaintPhone] = useState('');
    const [complaintEmail, setComplaintEmail] = useState('');
    const [complaintFiles, setComplaintFiles] = useState([]);
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    const [appealMessage, setAppealMessage] = useState('');
    const [appealFiles, setAppealFiles] = useState([]);
    const [submittingAppeal, setSubmittingAppeal] = useState(false);

    useEffect(() => {
        const fetchOrders = async (silent = false) => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                if (!silent) {
                    setIsLoading(true);
                }
                const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { token } });
                if (response.data?.success) {
                    setOrders(response.data.data || []);
                }
            } finally {
                if (!silent) {
                    setIsLoading(false);
                }
            }
        };

        fetchOrders();
        const intervalId = setInterval(() => fetchOrders(true), 5000);
        return () => clearInterval(intervalId);
    }, [token, url]);

    const order = useMemo(
        () => orders.find((item) => String(item._id) === String(orderId)),
        [orders, orderId]
    );

    const refreshOrderComplaintRow = useCallback(async () => {
        if (!token || !order?._id) {
            setOrderComplaintRow(null);
            return;
        }
        try {
            const res = await axios.get(`${url}/api/complaint/my`, { headers: { token } });
            if (!res.data?.success) {
                setOrderComplaintRow(null);
                return;
            }
            const list = res.data.data || [];
            const row = list.find((c) => String(c.orderId) === String(order._id)) || null;
            setOrderComplaintRow(row);
        } catch {
            setOrderComplaintRow(null);
        }
    }, [token, url, order?._id]);

    useEffect(() => {
        refreshOrderComplaintRow();
    }, [refreshOrderComplaintRow]);

    useEffect(() => {
        if (!token || !order?._id) return;
        const id = setInterval(() => {
            refreshOrderComplaintRow();
        }, 5000);
        return () => clearInterval(id);
    }, [token, order?._id, refreshOrderComplaintRow]);

    const complaintButtonWaiting = orderComplaintRow && WAITING_CUSTOMER_STATUSES.has(orderComplaintRow.status);

    const complaintButtonLabel = useMemo(() => {
        if (!orderComplaintRow) return 'Complaint';
        if (WAITING_CUSTOMER_STATUSES.has(orderComplaintRow.status)) return 'In Progress';
        return (
            STATUS_LABELS[orderComplaintRow.status] ||
            String(orderComplaintRow.status || '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())
        );
    }, [orderComplaintRow]);

    const complaintButtonClassExtra = useMemo(() => {
        if (!orderComplaintRow || complaintButtonWaiting) return '';
        const s = orderComplaintRow.status;
        if (s === 'rejected') return 'is-rejected';
        if (s === 'approved') return 'is-approved';
        if (s === 'resolved') return 'is-resolved';
        if (s === 'appeal_pending') return 'is-appeal-pending';
        return 'is-complaint-active';
    }, [orderComplaintRow, complaintButtonWaiting]);

    const loadComplaintForOrder = useCallback(async () => {
        if (!token || !order?._id) return;
        setComplaintPhase('loading');
        try {
            const res = await axios.get(`${url}/api/complaint/my`, { headers: { token } });
            if (!res.data?.success) {
                setComplaintPhase('form');
                return;
            }
            const list = res.data.data || [];
            const existing = list.find((c) => String(c.orderId) === String(order._id));
            if (!existing) {
                setTicket(null);
                setComplaintPhase('form');
                return;
            }
            const detailRes = await axios.get(`${url}/api/complaint/detail/${existing.ticketNumber}`, {
                headers: { token }
            });
            if (detailRes.data?.success) {
                setTicket(detailRes.data.data);
                setComplaintPhase('ticket');
                return;
            }
            setComplaintPhase('form');
        } catch {
            setComplaintPhase('form');
            toast.error('Could not load complaint data');
        }
    }, [token, url, order?._id]);

    const openComplaintModal = () => {
        if (!token) {
            toast.error('Please sign in to submit a complaint');
            return;
        }
        if (complaintButtonWaiting) {
            return;
        }
        setComplaintOpen(true);
        refreshOrderComplaintRow();
        setPolicyModalOpen(false);
        setAppealOpen(false);
        setComplaintType('staff_quality');
        setComplaintDescription('');
        setComplaintPhone('');
        setComplaintEmail('');
        setComplaintFiles([]);
        setPolicyAccepted(false);
        loadComplaintForOrder();
    };

    const closeComplaintModal = () => {
        setComplaintOpen(false);
        setComplaintPhase('idle');
        setTicket(null);
        setPolicyModalOpen(false);
        setAppealOpen(false);
    };

    const handleComplaintFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        const next = [];
        for (const f of picked) {
            if (f.size > MAX_BYTES) {
                toast.error(`"${f.name}" exceeds 2MB`);
                continue;
            }
            next.push(f);
            if (next.length >= MAX_FILES) break;
        }
        setComplaintFiles(next);
        e.target.value = '';
    };

    const submitComplaint = async (e) => {
        e.preventDefault();
        if (!order?._id || !token) return;
        if (!policyAccepted) {
            toast.error('Vui lòng xác nhận đã đọc chính sách khiếu nại');
            return;
        }
        const desc = complaintDescription.trim();
        if (!desc) {
            toast.error('Please enter a description');
            return;
        }
        setSubmittingComplaint(true);
        try {
            const fd = new FormData();
            fd.append('orderId', String(order._id));
            fd.append('type', complaintType);
            fd.append('description', desc);
            fd.append('contactPhone', complaintPhone.trim());
            fd.append('contactEmail', complaintEmail.trim());
            complaintFiles.forEach((file) => fd.append('images', file));

            const res = await axios.post(`${url}/api/complaint/create`, fd, {
                headers: { token }
            });

            if (res.data?.success) {
                setTicket(res.data.data);
                setComplaintPhase('ticket');
                toast.success('Complaint submitted');
                await refreshOrderComplaintRow();
                return;
            }

            if (res.data?.data?.ticketNumber) {
                const tn = res.data.data.ticketNumber;
                const detailRes = await axios.get(`${url}/api/complaint/detail/${tn}`, { headers: { token } });
                if (detailRes.data?.success) {
                    setTicket(detailRes.data.data);
                    setComplaintPhase('ticket');
                }
                toast.error(res.data?.message || 'You already have an open complaint for this order');
                await refreshOrderComplaintRow();
                return;
            }

            toast.error(res.data?.message || 'Could not submit complaint');
        } catch {
            toast.error('Connection error');
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const openAppealModal = () => {
        setAppealMessage('');
        setAppealFiles([]);
        setAppealOpen(true);
    };

    const handleAppealFiles = (e) => {
        const picked = Array.from(e.target.files || []);
        const next = [];
        for (const f of picked) {
            if (f.size > MAX_BYTES) {
                toast.error(`"${f.name}" exceeds 2MB`);
                continue;
            }
            next.push(f);
            if (next.length >= MAX_FILES) break;
        }
        setAppealFiles(next);
        e.target.value = '';
    };

    const submitAppeal = async (e) => {
        e.preventDefault();
        if (!ticket?.ticketNumber || !token) return;
        const msg = appealMessage.trim();
        if (!msg) {
            toast.error('Please explain why you disagree with the decision');
            return;
        }
        const hasEvidence = appealFiles.length > 0;
        const detailed = msg.length >= 40;
        if (!hasEvidence && !detailed) {
            toast.error('Add more detail (at least 40 characters) or attach image/video evidence');
            return;
        }
        setSubmittingAppeal(true);
        try {
            const fd = new FormData();
            fd.append('ticketNumber', ticket.ticketNumber);
            fd.append('message', msg);
            appealFiles.forEach((file) => fd.append('images', file));
            const res = await axios.post(`${url}/api/complaint/appeal`, fd, { headers: { token } });
            if (res.data?.success) {
                setTicket(res.data.data);
                setAppealOpen(false);
                toast.success('Appeal submitted');
                await refreshOrderComplaintRow();
            } else {
                toast.error(res.data?.message || 'Could not submit appeal');
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setSubmittingAppeal(false);
        }
    };

    const canShowAppeal =
        ticket &&
        ticket.status === 'rejected' &&
        !(ticket.appeal && ticket.appeal.message);

    const previewUrls = useMemo(() => complaintFiles.map((f) => URL.createObjectURL(f)), [complaintFiles]);
    useEffect(() => {
        return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
    }, [previewUrls]);

    const appealPreviewUrls = useMemo(() => appealFiles.map((f) => URL.createObjectURL(f)), [appealFiles]);
    useEffect(() => {
        return () => appealPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    }, [appealPreviewUrls]);

    if (isLoading) {
        return <div className='order-details'>Loading order details...</div>;
    }

    if (!order) {
        return (
            <div className='order-details order-details-empty'>
                <h2>Order not found</h2>
                <p>This order does not exist or is no longer available.</p>
                <button type='button' onClick={() => navigate('/myorders')}>
                    Back to My Orders
                </button>
            </div>
        );
    }

    const subtotal = Number(order.amount || 0);
    const paymentLabel = order.paymentMethod === 'vnpay' ? 'VNPAY' : 'Cash on Delivery';

    return (
        <div className='order-details'>
            <div className='order-details-header'>
                <h2>Order Details</h2>
                <button
                    type='button'
                    className={`order-details-complaint-btn ${complaintButtonWaiting ? 'is-waiting' : ''} ${complaintButtonClassExtra}`}
                    onClick={openComplaintModal}
                    disabled={complaintButtonWaiting}
                    title={
                        complaintButtonWaiting
                            ? 'Your complaint is being processed'
                            : orderComplaintRow
                              ? `Complaint — ${complaintButtonLabel}. Click to view details.`
                              : 'Submit a complaint about this order'
                    }
                >
                    {complaintButtonLabel}
                </button>
            </div>

            <div className='order-details-grid'>
                <div className='order-details-card'>
                    <h3>Status</h3>
                    <p>{order.status}</p>
                </div>
                <div className='order-details-card'>
                    <h3>Payment</h3>
                    <p>{paymentLabel}</p>
                </div>
                <div className='order-details-card'>
                    <h3>Total</h3>
                    <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className='order-details-card'>
                    <h3>Items</h3>
                    <p>{order.items.length}</p>
                </div>
            </div>

            <div className='order-details-section'>
                <h3>Delivery Address</h3>
                <p>
                    {order.address?.firstName} {order.address?.lastName}
                </p>
                <p>{order.address?.street}</p>
                <p>
                    {order.address?.city}
                    {order.address?.district ? ` - ${order.address.district}` : ''}
                </p>
                <p>{order.address?.phone}</p>
            </div>

            <div className='order-details-section'>
                <h3>Ordered Items</h3>
                <ul>
                    {order.items.map((item, index) => (
                        <li key={`${item.name}-${index}`}>
                            <span>{item.name}</span>
                            <span>x{item.quantity}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {complaintOpen ? (
                <div className='complaint-modal-overlay' role='presentation' onClick={closeComplaintModal}>
                    <div
                        className='complaint-modal'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='complaint-modal-title'
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className='complaint-modal-head'>
                            <h2 id='complaint-modal-title'>Complaint</h2>
                        </div>

                        {complaintPhase === 'loading' ? (
                            <p className='complaint-modal-loading'>Loading…</p>
                        ) : complaintPhase === 'ticket' && ticket ? (
                            <div className='complaint-ticket-view'>
                                <div className='complaint-ticket-field'>
                                    <span className='complaint-ticket-label'>Ticket number</span>
                                    <strong>{ticket.ticketNumber}</strong>
                                </div>
                                <div className='complaint-ticket-field'>
                                    <span className='complaint-ticket-label'>Order ID</span>
                                    <span className='complaint-ticket-readonly'>{ticket.orderId}</span>
                                </div>
                                <div className='complaint-ticket-field'>
                                    <span className='complaint-ticket-label'>Status</span>
                                    <span>{STATUS_LABELS[ticket.status] || ticket.status}</span>
                                </div>
                                <div className='complaint-ticket-field'>
                                    <span className='complaint-ticket-label'>Type</span>
                                    <span>{typeLabel(ticket.type)}</span>
                                </div>
                                <div className='complaint-ticket-field complaint-ticket-block'>
                                    <span className='complaint-ticket-label'>Description</span>
                                    <p>{ticket.description}</p>
                                </div>
                                {ticket.contactPhone || ticket.contactEmail ? (
                                    <div className='complaint-ticket-field complaint-ticket-block'>
                                        <span className='complaint-ticket-label'>Contact</span>
                                        {ticket.contactPhone ? (
                                            <p>
                                                <strong>Phone:</strong> {ticket.contactPhone}
                                            </p>
                                        ) : null}
                                        {ticket.contactEmail ? (
                                            <p>
                                                <strong>Email:</strong> {ticket.contactEmail}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                                {ticket.images?.length > 0 ? (
                                    <div className='complaint-ticket-field complaint-ticket-block'>
                                        <span className='complaint-ticket-label'>Images or evidence</span>
                                        <div className='complaint-ticket-images'>
                                            {ticket.images.map((src) => (
                                                <a key={src} href={src} target='_blank' rel='noreferrer'>
                                                    <img src={src} alt='Evidence' />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {ticket.appeal?.message ? (
                                    <div className='complaint-ticket-field complaint-ticket-block'>
                                        <span className='complaint-ticket-label'>Your appeal</span>
                                        <p>{ticket.appeal.message}</p>
                                        {ticket.appeal.images?.length > 0 ? (
                                            <div className='complaint-ticket-images'>
                                                {ticket.appeal.images.map((src) =>
                                                    isVideoUrl(src) ? (
                                                        <video
                                                            key={src}
                                                            src={src}
                                                            className='complaint-ticket-video'
                                                            controls
                                                            playsInline
                                                        />
                                                    ) : (
                                                        <a key={src} href={src} target='_blank' rel='noreferrer'>
                                                            <img src={src} alt='Appeal evidence' />
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        ) : null}
                                        <p className='complaint-appeal-date'>
                                            Submitted {formatWhen(ticket.appeal.submittedAt)}
                                        </p>
                                    </div>
                                ) : null}
                                <div className='complaint-ticket-field complaint-ticket-block'>
                                    <span className='complaint-ticket-label'>Response history</span>
                                    {ticket.responses?.length ? (
                                        <ul className='complaint-response-list'>
                                            {ticket.responses.map((r, idx) => (
                                                <li key={idx}>
                                                    <div className='complaint-response-meta'>
                                                        {r.authorRole || 'Support'} · {formatWhen(r.createdAt)}
                                                    </div>
                                                    <div>{r.message}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className='complaint-no-responses'>No responses yet. We will update you here.</p>
                                    )}
                                </div>
                                {canShowAppeal ? (
                                    <button type='button' className='complaint-btn-appeal' onClick={openAppealModal}>
                                        Appeal
                                    </button>
                                ) : null}
                                <button type='button' className='complaint-modal-done' onClick={closeComplaintModal}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form className='complaint-form' onSubmit={submitComplaint}>
                                <div className='complaint-form-section'>
                                    <label className='complaint-form-label'>
                                        <span className='complaint-form-label-text'>Order ID</span>
                                        <input
                                            type='text'
                                            readOnly
                                            value={String(order._id)}
                                            className='complaint-form-input complaint-form-input-readonly'
                                        />
                                    </label>
                                    <label className='complaint-form-label'>
                                        <span className='complaint-form-label-text'>Complaint type</span>
                                        <select
                                            className='complaint-form-input complaint-form-select'
                                            value={complaintType}
                                            onChange={(e) => setComplaintType(e.target.value)}
                                        >
                                            {COMPLAINT_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className='complaint-form-section complaint-form-section-story'>
                                    <label className='complaint-form-label'>
                                        <span className='complaint-form-label-text'>Detailed description</span>
                                        <textarea
                                            className='complaint-form-textarea'
                                            value={complaintDescription}
                                            onChange={(e) => setComplaintDescription(e.target.value)}
                                            rows={5}
                                            required
                                            placeholder='Please describe your problem in detail.'
                                        />
                                    </label>
                                    <div className='complaint-form-file-zone'>
                                        <label className='complaint-form-label complaint-form-label-file'>
                                            <span className='complaint-form-label-text'>Images or evidence</span>
                                            <span className='complaint-form-file-hint'>Up to 5 images, 2MB each.</span>
                                            <div className='complaint-file-preview-wrap'>
                                                {complaintFiles.length > 0 ? (
                                                    <div className='complaint-file-preview-tile'>
                                                        <img src={previewUrls[0]} alt='' />
                                                        {complaintFiles.length > 1 ? (
                                                            <span className='complaint-file-more'>
                                                                +{complaintFiles.length - 1}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                                <span className='complaint-form-file-drop'>
                                                    <span className='complaint-form-file-icon' aria-hidden='true'>
                                                        📷
                                                    </span>
                                                    <span className='complaint-form-file-copy'>
                                                        Tap to choose images (optional)
                                                    </span>
                                                    <input
                                                        type='file'
                                                        accept='image/*'
                                                        multiple
                                                        className='complaint-form-file'
                                                        onChange={handleComplaintFiles}
                                                    />
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className='complaint-form-contact-panel'>
                                    <h3 className='complaint-form-contact-heading'>Contact information</h3>
                                    <p className='complaint-form-contact-intro'>
                                        We will respond to your complaint as soon as possible.
                                    </p>
                                    <label className='complaint-form-label'>
                                        <span className='complaint-form-label-text'>Phone</span>
                                        <input
                                            type='tel'
                                            className='complaint-form-input'
                                            value={complaintPhone}
                                            onChange={(e) => setComplaintPhone(e.target.value)}
                                            placeholder='Your phone number'
                                            autoComplete='tel'
                                        />
                                    </label>
                                    <label className='complaint-form-label'>
                                        <span className='complaint-form-label-text'>Email</span>
                                        <input
                                            type='email'
                                            className='complaint-form-input'
                                            value={complaintEmail}
                                            onChange={(e) => setComplaintEmail(e.target.value)}
                                            placeholder='Your email address'
                                            autoComplete='email'
                                        />
                                    </label>
                                </div>
                                <label className='complaint-policy-check'>
                                    <input
                                        type='checkbox'
                                        checked={policyAccepted}
                                        onChange={(e) => setPolicyAccepted(e.target.checked)}
                                    />
                                    <span>
                                        Tôi đã xem{' '}
                                        <button
                                            type='button'
                                            className='complaint-policy-link'
                                            onClick={() => setPolicyModalOpen(true)}
                                        >
                                            chính sách khiếu nại
                                        </button>
                                        .
                                    </span>
                                </label>
                                <div className='complaint-form-actions'>
                                    <button type='button' className='complaint-btn-secondary' onClick={closeComplaintModal}>
                                        Cancel
                                    </button>
                                    <button type='submit' className='complaint-btn-primary' disabled={submittingComplaint}>
                                        {submittingComplaint ? 'Sending…' : 'Submit complaint'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}

            {policyModalOpen ? (
                <div className='complaint-modal-overlay complaint-policy-overlay' role='presentation' onClick={() => setPolicyModalOpen(false)}>
                    <div
                        className='complaint-policy-modal'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='complaint-policy-title'
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <h3 id='complaint-policy-title'>Chính sách khiếu nại</h3>
                        <div className='complaint-policy-body'>
                            <pre className='complaint-policy-pre'>{COMPLAINT_POLICY_TEXT}</pre>
                        </div>
                        <button type='button' className='complaint-modal-done' onClick={() => setPolicyModalOpen(false)}>
                            Close
                        </button>
                    </div>
                </div>
            ) : null}

            {appealOpen ? (
                <div className='complaint-modal-overlay' role='presentation' onClick={() => setAppealOpen(false)}>
                    <div
                        className='complaint-modal complaint-appeal-modal'
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='appeal-title'
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className='complaint-modal-head'>
                            <h2 id='appeal-title'>Appeal</h2>
                        </div>
                        <form className='complaint-form' onSubmit={submitAppeal}>
                            <p className='complaint-appeal-intro'>
                                Please explain why you disagree with the decision and add clearer photos or a short video
                                if possible.
                            </p>
                            <label className='complaint-form-label'>
                                <span className='complaint-form-label-text'>Reason</span>
                                <textarea
                                    className='complaint-form-textarea'
                                    value={appealMessage}
                                    onChange={(e) => setAppealMessage(e.target.value)}
                                    rows={4}
                                    required
                                    placeholder='Why do you believe the decision should be reviewed?'
                                />
                            </label>
                            <div className='complaint-form-file-zone'>
                                <span className='complaint-form-label-text'>Additional evidence (recommended)</span>
                                <span className='complaint-form-file-hint'>Up to 5 files, 2MB each — images or video.</span>
                                <div className='complaint-file-preview-wrap'>
                                    {appealFiles.length > 0 ? (
                                        <div className='complaint-file-preview-tile'>
                                            {appealFiles[0]?.type?.startsWith('video') ? (
                                                <video
                                                    src={appealPreviewUrls[0]}
                                                    className='complaint-file-preview-video'
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <img src={appealPreviewUrls[0]} alt='' />
                                            )}
                                            {appealFiles.length > 1 ? (
                                                <span className='complaint-file-more'>+{appealFiles.length - 1}</span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    <span className='complaint-form-file-drop'>
                                        <span className='complaint-form-file-copy'>Choose files</span>
                                        <input
                                            type='file'
                                            accept='image/*,video/*'
                                            multiple
                                            className='complaint-form-file'
                                            onChange={handleAppealFiles}
                                        />
                                    </span>
                                </div>
                            </div>
                            <div className='complaint-form-actions'>
                                <button type='button' className='complaint-btn-secondary' onClick={() => setAppealOpen(false)}>
                                    Cancel
                                </button>
                                <button type='submit' className='complaint-btn-primary' disabled={submittingAppeal}>
                                    {submittingAppeal ? 'Sending…' : 'Submit appeal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default OrdersDetails;
