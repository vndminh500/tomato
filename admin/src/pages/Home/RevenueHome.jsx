import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./RevenueHome.css";

const CHART_COLORS = ["#ff6b4a", "#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    maximumFractionDigits: 0
  }) + " VNĐ";

const buildPieStyle = (segments) => {
  if (!segments.length) {
    return { background: "conic-gradient(#e6ecf5 0deg 360deg)" };
  }
  const stops = [];
  let cursor = 0;
  segments.forEach((segment) => {
    const next = cursor + segment.percent * 360;
    stops.push(`${segment.color} ${cursor}deg ${next}deg`);
    cursor = next;
  });
  if (cursor < 360) {
    stops.push(`#e6ecf5 ${cursor}deg 360deg`);
  }
  return { background: `conic-gradient(${stops.join(", ")})` };
};

const normalizeMethod = (method) => {
  const raw = String(method || "").trim().toLowerCase();
  if (raw === "cod") return "COD";
  if (raw === "vnpay") return "VNPAY";
  if (!raw) return "Other";
  return raw.toUpperCase();
};

const toInputDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getMonthKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getDayKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatSeriesLabel = (key, granularity) => {
  if (granularity === "month") {
    const [y, m] = key.split("-");
    return `${m}/${y}`;
  }
  return key;
};

const buildLinePoints = (series, width = 700, height = 240, padding = 26) => {
  if (!series.length) return "";
  if (series.length === 1) {
    const y = height - padding;
    return `${padding},${y}`;
  }
  const max = Math.max(...series.map((x) => x.value), 0);
  return series
    .map((item, idx) => {
      const x = padding + (idx / (series.length - 1)) * (width - padding * 2);
      const yRatio = max > 0 ? item.value / max : 0;
      const y = height - padding - yRatio * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
};

const buildLineCoordinates = (series, width = 700, height = 240, padding = 26) => {
  if (!series.length) return [];
  const max = Math.max(...series.map((x) => x.value), 0);
  return series.map((item, idx) => {
    const x = series.length === 1 ? width / 2 : padding + (idx / (series.length - 1)) * (width - padding * 2);
    const yRatio = max > 0 ? item.value / max : 0;
    const y = height - padding - yRatio * (height - padding * 2);
    return { ...item, x, y };
  });
};

const RevenueHome = ({ url, token, canReadOrders = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState("day");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token || !canReadOrders) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${url}/api/order/list`, { headers: { token } });
        if (res.data?.success) {
          setOrders(res.data.data || []);
        } else {
          toast.error("Unable to load revenue data");
        }
      } catch {
        toast.error("Unable to load revenue data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [url, token, canReadOrders]);

  const validOrders = useMemo(
    () =>
      orders.filter((order) => {
        return order.status === "Delivered" && Boolean(order.payment) === true;
      }),
    [orders]
  );

  const dateBounds = useMemo(() => {
    if (!validOrders.length) return { min: "", max: "" };
    const sorted = [...validOrders]
      .map((order) => new Date(order.date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b);
    if (!sorted.length) return { min: "", max: "" };
    return { min: toInputDate(sorted[0]), max: toInputDate(sorted[sorted.length - 1]) };
  }, [validOrders]);

  useEffect(() => {
    if (!startDate && dateBounds.min) setStartDate(dateBounds.min);
    if (!endDate && dateBounds.max) setEndDate(dateBounds.max);
  }, [dateBounds, startDate, endDate]);

  const filteredOrders = useMemo(() => {
    const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const to = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return validOrders.filter((order) => {
      const date = new Date(order.date);
      if (Number.isNaN(date.getTime())) return false;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  }, [validOrders, startDate, endDate]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const methodMap = new Map();
    filteredOrders.forEach((order) => {
      const method = normalizeMethod(order.paymentMethod);
      methodMap.set(method, (methodMap.get(method) || 0) + Number(order.amount || 0));
    });
    const methodSegments = [...methodMap.entries()]
      .map(([name, revenue], index) => ({
        name,
        revenue,
        percent: totalRevenue > 0 ? revenue / totalRevenue : 0,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const monthlyMap = new Map();
    validOrders.forEach((order) => {
      const key = getMonthKey(order.date);
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(order.amount || 0));
    });
    const monthKeys = [...monthlyMap.keys()].sort();
    const thisMonthKey = monthKeys[monthKeys.length - 1] || "";
    const prevMonthKey = monthKeys[monthKeys.length - 2] || "";
    const thisMonthRevenue = monthlyMap.get(thisMonthKey) || 0;
    const prevMonthRevenue = monthlyMap.get(prevMonthKey) || 0;
    const growthPercent =
      prevMonthRevenue > 0 ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : thisMonthRevenue > 0 ? 100 : 0;

    const seriesMap = new Map();
    filteredOrders.forEach((order) => {
      const key = groupBy === "month" ? getMonthKey(order.date) : getDayKey(order.date);
      seriesMap.set(key, (seriesMap.get(key) || 0) + Number(order.amount || 0));
    });
    const lineSeries = [...seriesMap.entries()]
      .map(([key, value]) => ({ key, label: formatSeriesLabel(key, groupBy), value }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const productMap = new Map();
    filteredOrders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const qtyTotal = items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
      items.forEach((item) => {
        const name = String(item?.name || "Unknown item");
        const quantity = Number(item?.quantity || 0);
        if (quantity <= 0) return;
        const rawPrice = Number(item?.price ?? item?.new_price ?? 0);
        const unitPrice = rawPrice > 0 ? rawPrice : qtyTotal > 0 ? Number(order.amount || 0) / qtyTotal : 0;
        const lineRevenue = unitPrice * quantity;
        const current = productMap.get(name) || { name, quantity: 0, revenue: 0 };
        current.quantity += quantity;
        current.revenue += lineRevenue;
        productMap.set(name, current);
      });
    });
    const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      methodSegments,
      thisMonthRevenue,
      prevMonthRevenue,
      growthPercent,
      lineSeries,
      topProducts
    };
  }, [filteredOrders, validOrders, groupBy]);

  const lineDetails = useMemo(() => {
    const series = stats.lineSeries;
    if (!series.length) {
      return {
        points: [],
        max: 0,
        min: 0,
        avg: 0,
        best: null,
        worst: null,
        first: null,
        last: null,
        deltaPercent: 0
      };
    }
    const points = buildLineCoordinates(series);
    const values = series.map((x) => x.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const best = series.find((x) => x.value === max) || series[0];
    const worst = series.find((x) => x.value === min) || series[0];
    const first = series[0];
    const last = series[series.length - 1];
    const deltaPercent = first.value > 0 ? ((last.value - first.value) / first.value) * 100 : last.value > 0 ? 100 : 0;
    return { points, max, min, avg, best, worst, first, last, deltaPercent };
  }, [stats.lineSeries]);

  if (!canReadOrders) {
    return (
      <section className="revenue-home">
        <div className="revenue-empty">
          <h3>Revenue Dashboard</h3>
          <p>You do not have permission to view revenue analytics.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="revenue-home">
      <div className="revenue-head">
        <div>
          <h3>Revenue Dashboard</h3>
          <p>Only orders with status Delivered and payment completed are counted as revenue.</p>
        </div>
        <div className="revenue-filters">
          <label>
            From
            <input
              type="date"
              value={startDate}
              min={dateBounds.min || undefined}
              max={endDate || dateBounds.max || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={endDate}
              min={startDate || dateBounds.min || undefined}
              max={dateBounds.max || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <label>
            Group by
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </label>
        </div>
      </div>

      <div className="revenue-kpi-grid revenue-kpi-grid--4">
        <article className="revenue-kpi-card">
          <span>Total Revenue</span>
          <strong>{loading ? "Loading..." : formatCurrency(stats.totalRevenue)}</strong>
        </article>
        <article className="revenue-kpi-card">
          <span>Successful Orders</span>
          <strong>{loading ? "Loading..." : stats.totalOrders.toLocaleString("vi-VN")}</strong>
        </article>
        <article className="revenue-kpi-card">
          <span>Average Order Value</span>
          <strong>{loading ? "Loading..." : formatCurrency(stats.avgOrderValue)}</strong>
        </article>
        <article className="revenue-kpi-card">
          <span>Month-over-Month Growth</span>
          <strong className={stats.growthPercent >= 0 ? "growth-up" : "growth-down"}>
            {loading ? "Loading..." : `${stats.growthPercent >= 0 ? "+" : ""}${stats.growthPercent.toFixed(1)}%`}
          </strong>
          {!loading ? (
            <small>
              {formatCurrency(stats.thisMonthRevenue)} vs {formatCurrency(stats.prevMonthRevenue)}
            </small>
          ) : null}
        </article>
      </div>

      <div className="revenue-chart-card">
        <div className="revenue-chart-title-wrap">
          <h4>Revenue Growth ({groupBy === "day" ? "Daily" : "Monthly"})</h4>
          <p>Line chart in selected date range.</p>
        </div>
        {loading ? (
          <p className="revenue-muted">Loading chart...</p>
        ) : stats.lineSeries.length === 0 ? (
          <p className="revenue-muted">No data in selected range.</p>
        ) : (
          <div className="revenue-line-wrap">
            <div className="revenue-growth-summary">
              <div className="growth-pill">
                <span>Peak</span>
                <strong>{formatCurrency(lineDetails.max)}</strong>
                <small>{lineDetails.best?.label || "-"}</small>
              </div>
              <div className="growth-pill">
                <span>Lowest</span>
                <strong>{formatCurrency(lineDetails.min)}</strong>
                <small>{lineDetails.worst?.label || "-"}</small>
              </div>
              <div className="growth-pill">
                <span>Average</span>
                <strong>{formatCurrency(lineDetails.avg)}</strong>
                <small>{stats.lineSeries.length} points</small>
              </div>
              <div className="growth-pill">
                <span>Trend</span>
                <strong className={lineDetails.deltaPercent >= 0 ? "growth-up" : "growth-down"}>
                  {`${lineDetails.deltaPercent >= 0 ? "+" : ""}${lineDetails.deltaPercent.toFixed(1)}%`}
                </strong>
                <small>
                  {lineDetails.first?.label || "-"} -> {lineDetails.last?.label || "-"}
                </small>
              </div>
            </div>
            <svg viewBox="0 0 700 240" role="img" aria-label="Revenue line chart" className="revenue-line-chart">
              <polyline fill="none" stroke="#dbe3f0" strokeWidth="1" points="26,214 674,214" />
              <polyline fill="none" stroke="#eef3fa" strokeWidth="1" points="26,150 674,150" />
              <polyline fill="none" stroke="#eef3fa" strokeWidth="1" points="26,88 674,88" />
              <polyline
                fill="none"
                stroke="#ff6b4a"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={buildLinePoints(stats.lineSeries)}
              />
              {lineDetails.points.map((point) => (
                <circle key={point.key} cx={point.x} cy={point.y} r="4.5" fill="#ff6b4a" stroke="#fff" strokeWidth="2" />
              ))}
            </svg>
            <div className="revenue-line-labels">
              {stats.lineSeries.map((point) => (
                <span key={point.key}>{point.label}</span>
              ))}
            </div>
            <div className="revenue-growth-table-wrap">
              <table className="revenue-growth-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Revenue</th>
                    <th>Change vs Prev</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lineSeries.map((point, idx) => {
                    const prev = idx > 0 ? stats.lineSeries[idx - 1].value : null;
                    const pct = prev && prev > 0 ? ((point.value - prev) / prev) * 100 : null;
                    return (
                      <tr key={point.key}>
                        <td>{point.label}</td>
                        <td>{formatCurrency(point.value)}</td>
                        <td className={pct === null || pct >= 0 ? "growth-up" : "growth-down"}>
                          {pct === null ? "-" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="revenue-chart-card">
        <div className="revenue-chart-title-wrap">
          <h4>Revenue by Payment Method</h4>
          <p>Pie chart from delivered and paid orders only.</p>
        </div>

        {loading ? (
          <p className="revenue-muted">Loading chart...</p>
        ) : stats.methodSegments.length === 0 ? (
          <p className="revenue-muted">No revenue data available yet.</p>
        ) : (
          <div className="revenue-chart-content">
            <div className="revenue-pie" style={buildPieStyle(stats.methodSegments)} aria-label="Revenue pie chart" />
            <ul className="revenue-legend">
              {stats.methodSegments.map((segment) => (
                <li key={segment.name}>
                  <span className="dot" style={{ backgroundColor: segment.color }} />
                  <div className="legend-copy">
                    <p>{segment.name}</p>
                    <small>
                      {formatCurrency(segment.revenue)} ({(segment.percent * 100).toFixed(1)}%)
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="revenue-chart-card">
        <div className="revenue-chart-title-wrap">
          <h4>Top Selling Products</h4>
          <p>Top dishes by revenue in selected range.</p>
        </div>
        {loading ? (
          <p className="revenue-muted">Loading products...</p>
        ) : stats.topProducts.length === 0 ? (
          <p className="revenue-muted">No product data in selected range.</p>
        ) : (
          <div className="revenue-table-wrap">
            <table className="revenue-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Sold Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((item, idx) => (
                  <tr key={`${item.name}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.quantity.toLocaleString("vi-VN")}</td>
                    <td>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default RevenueHome;
