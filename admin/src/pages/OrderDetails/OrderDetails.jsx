import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./OrderDetails.css";

const currency = (amount) => {
  const value = Number(amount || 0);
  return `$${value.toFixed(2)}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const OrderDetails = ({ url, token }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const basePath = outletContext?.basePath ?? "";
  const ordersPath = basePath ? `${basePath}/orders` : "/orders";
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${url}/api/order/${orderId}`, {
          headers: { token }
        });
        if (response.data?.success) {
          setOrder(response.data.data);
        } else {
          toast.error(response.data?.message || "Unable to load order details");
        }
      } catch {
        toast.error("Unable to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, token, url]);

  const totalQuantity = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  }, [order]);

  if (isLoading) {
    return (
      <div className="order-details add">
        <h3>Order Details</h3>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details add">
        <h3>Order Details</h3>
        <p>Order not found.</p>
        <button type="button" className="order-details-back-btn" onClick={() => navigate("/orders")}>
          Back to orders
        </button>
      </div>
    );
  }

  const addressLine = [
    order.address?.street,
    order.address?.district || order.address?.state,
    order.address?.city
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="order-details add">
      <div className="order-details-header">
        <div>
          <h3>Order Details</h3>
          <p className="order-details-subtitle">Order ID: {order._id}</p>
        </div>
        <button type="button" className="order-details-back-btn" onClick={() => navigate(ordersPath)}>
          Back to orders
        </button>
      </div>

      <div className="order-details-grid">
        <section className="order-details-card">
          <h4>Overview</h4>
          <div className="order-details-kv"><span>Status</span><b>{order.status || "-"}</b></div>
          <div className="order-details-kv"><span>Payment method</span><b>{(order.paymentMethod || "-").toUpperCase()}</b></div>
          <div className="order-details-kv"><span>Payment status</span><b>{order.payment ? "Paid" : "Unpaid"}</b></div>
          <div className="order-details-kv"><span>Total amount</span><b>{currency(order.amount)}</b></div>
          <div className="order-details-kv"><span>Total items</span><b>{totalQuantity}</b></div>
          <div className="order-details-kv"><span>Stock deducted</span><b>{order.stockDeducted ? "Yes" : "No"}</b></div>
        </section>

        <section className="order-details-card">
          <h4>Customer</h4>
          <div className="order-details-kv"><span>Name</span><b>{`${order.address?.firstName || ""} ${order.address?.lastName || ""}`.trim() || "-"}</b></div>
          <div className="order-details-kv"><span>Phone</span><b>{order.address?.phone || "-"}</b></div>
          <div className="order-details-kv"><span>Email</span><b>{order.address?.email || "-"}</b></div>
          <div className="order-details-kv"><span>Address</span><b>{addressLine || "-"}</b></div>
          <div className="order-details-kv"><span>Postal code</span><b>{order.address?.zipcode || "-"}</b></div>
        </section>
      </div>

      <section className="order-details-card order-details-full">
        <h4>Order Items</h4>
        <div className="order-items-table">
          <div className="order-items-row title">
            <b>Item</b>
            <b>Quantity</b>
            <b>Unit price</b>
            <b>Line total</b>
          </div>
          {(order.items || []).map((item, index) => {
            const quantity = Number(item?.quantity || 0);
            const unitPrice = Number(item?.price || 0);
            return (
              <div className="order-items-row" key={`${item?._id || item?.name || "item"}-${index}`}>
                <p>{item?.name || "Unknown item"}</p>
                <p>{quantity}</p>
                <p>{currency(unitPrice)}</p>
                <p>{currency(quantity * unitPrice)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="order-details-card order-details-full">
        <h4>Audit</h4>
        <div className="order-details-kv"><span>Created at</span><b>{formatDateTime(order.date)}</b></div>
        <div className="order-details-kv"><span>Cancelled at</span><b>{formatDateTime(order.cancelledAt)}</b></div>
        <div className="order-details-kv"><span>Cancelled by</span><b>{order.cancelledBy || "-"}</b></div>
        <div className="order-details-kv"><span>Cancel reason</span><b>{order.cancelReason || "-"}</b></div>
        <div className="order-details-kv"><span>Stock deducted at</span><b>{formatDateTime(order.stockDeductedAt)}</b></div>
      </section>
    </div>
  );
};

export default OrderDetails;
