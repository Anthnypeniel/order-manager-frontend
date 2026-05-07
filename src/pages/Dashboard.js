import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import RevenueChart from "../components/RevenueCharts";
import {
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineDotsVertical,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

// ── Tiny sparkline bar chart ──────────────────────────────────
const SparkBar = ({ value, max, color }) => (
  <div className="flex items-end gap-0.5 h-8">
    {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, value / (max || 1)].map((h, i) => (
      <div
        key={i}
        className="flex-1 rounded-sm transition-all duration-500"
        style={{
          height: `${Math.max(15, h * 100)}%`,
          backgroundColor: i === 6 ? color : `${color}40`,
          opacity: 0.7 + i * 0.05,
        }}
      />
    ))}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  prefix,
  change,
  icon: Icon,
  color,
  sparkValue,
  sparkMax,
  isDark,
}) => {
  const isPositive = change >= 0;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group cursor-default ${
        isDark
          ? "bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-black/30"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-gray-100"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive
              ? isDark
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-emerald-50 text-emerald-600"
              : isDark
                ? "bg-red-500/10 text-red-400"
                : "bg-red-50 text-red-500"
          }`}
        >
          {isPositive ? (
            <HiOutlineArrowUp className="w-3 h-3" />
          ) : (
            <HiOutlineArrowDown className="w-3 h-3" />
          )}
          {Math.abs(change)}%
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <p
          className={`text-[11px] font-semibold uppercase tracking-widest mb-1.5 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {title}
        </p>
        <p
          className={`text-2xl font-bold tracking-tight ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      {/* Sparkline */}
      <SparkBar value={sparkValue} max={sparkMax} color={color} />

      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: `${color}06` }}
      />
    </div>
  );
};

// ── Order Status Badge ────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-400",
    },
    confirmed: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-400",
    },
    processing: {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      dot: "bg-purple-400",
    },
    completed: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-400",
    },
    cancelled: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-500 dark:text-red-400",
      dot: "bg-red-400",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ── Order Row ─────────────────────────────────────────────────
const OrderRow = ({ order, isDark, onClick, index }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150 group ${
      isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50/80"
    }`}
    style={{ animationDelay: `${index * 60}ms` }}
  >
    {/* Avatar */}
    <div className="relative flex-shrink-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
        style={{
          background: `hsl(${(order.customer?.name?.charCodeAt(0) || 65) * 5}, 60%, 45%)`,
        }}
      >
        {order.customer?.name?.charAt(0).toUpperCase()}
      </div>
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p
          className={`text-sm font-semibold truncate ${isDark ? "text-gray-100" : "text-gray-800"}`}
        >
          {order.customer?.name}
        </p>
      </div>
      <p
        className={`text-xs truncate mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
      >
        {order.orderNumber} &middot; {order.items?.length} item
        {order.items?.length !== 1 ? "s" : ""}
      </p>
    </div>

    {/* Status */}
    <div className="hidden sm:block flex-shrink-0">
      <StatusBadge status={order.status} />
    </div>

    {/* Amount */}
    <div className="flex-shrink-0 text-right">
      <p
        className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
      >
        ₦{order.totalAmount?.toLocaleString()}
      </p>
      <p
        className={`text-[10px] mt-0.5 ${
          order.paymentStatus === "paid"
            ? "text-emerald-500"
            : order.paymentStatus === "partial"
              ? "text-amber-500"
              : isDark
                ? "text-gray-500"
                : "text-gray-400"
        }`}
      >
        {order.paymentStatus}
      </p>
    </div>

    {/* Arrow */}
    <HiOutlineArrowRight
      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
        isDark ? "text-gray-700" : "text-gray-300"
      }`}
    />
  </div>
);

// ── Progress Bar ──────────────────────────────────────────────
const ProgressBar = ({ label, value, total, color, isDark }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {label}
        </span>
        <span
          className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
        >
          {pct}%
        </span>
      </div>
      <div
        className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}
        >
          ₦{value.toLocaleString()}
        </span>
        <span
          className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}
        >
          of ₦{total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────
const EmptyOrders = ({ isDark, onCreateOrder }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
    <div
      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
        isDark ? "bg-gray-800" : "bg-gray-50"
      }`}
    >
      <HiOutlineShoppingBag
        className={`w-7 h-7 ${isDark ? "text-gray-600" : "text-gray-300"}`}
      />
    </div>
    <p
      className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
    >
      No orders yet
    </p>
    <p
      className={`text-xs mt-1 max-w-[200px] leading-relaxed ${isDark ? "text-gray-600" : "text-gray-400"}`}
    >
      Create your first order to start tracking your revenue
    </p>
    <button
      onClick={onCreateOrder}
      className="btn-primary text-xs px-4 py-2 mt-5"
    >
      <HiOutlinePlus className="w-3.5 h-3.5" />
      Create first order
    </button>
  </div>
);

// ── Source Breakdown — shows vendors where their money comes from.
// This is the insight that makes OrderManager worth paying for daily.
const SourceBreakdown = ({ orders, isDark }) => {
  const SOURCE_META = {
    whatsapp: { label: "WhatsApp", emoji: "💬", color: "#25D366" },
    instagram: { label: "Instagram", emoji: "📸", color: "#E1306C" },
    facebook: { label: "Facebook", emoji: "👥", color: "#1877F2" },
    tiktok: { label: "TikTok", emoji: "🎵", color: "#010101" },
    website: { label: "Website", emoji: "🌐", color: "#6366f1" },
    walkin: { label: "Walk-in", emoji: "🚶", color: "#f59e0b" },
    referral: { label: "Referral", emoji: "🤝", color: "#8b5cf6" },
    other: { label: "Other", emoji: "📦", color: "#6b7280" },
  };

  // Aggregate revenue by source from recent orders
  const breakdown = orders.reduce((acc, order) => {
    if (order.status === "cancelled") return acc;
    const src = order.source || "whatsapp";
    if (!acc[src]) acc[src] = { revenue: 0, orders: 0 };
    acc[src].revenue += order.totalAmount || 0;
    acc[src].orders += 1;
    return acc;
  }, {});

  // Sort by revenue descending — best channel first
  const sorted = Object.entries(breakdown)
    .map(([key, data]) => ({ key, ...data, ...SOURCE_META[key] }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = sorted.reduce((s, d) => s + d.revenue, 0);

  if (sorted.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      <div
        className={`px-5 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}
      >
        <h2
          className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Sales by Source
        </h2>
        <p
          className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          Where your revenue is coming from
        </p>
      </div>

      <div className="p-5 space-y-4">
        {sorted.map((item) => {
          const pct =
            totalRevenue > 0
              ? Math.round((item.revenue / totalRevenue) * 100)
              : 0;

          return (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.emoji}</span>
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isDark
                        ? "bg-gray-800 text-gray-500"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {item.orders} order{item.orders !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {pct}%
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ₦{item.revenue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress bar — width encodes share of total revenue */}
              <div
                className={`h-1.5 rounded-full overflow-hidden ${
                  isDark ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [todayData, setTodayData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(false);
    try {
      const [todayRes, summaryRes, ordersRes] = await Promise.all([
        API.get("/orders/today"),
        API.get("/orders/summary"),
        API.get("/orders?limit=6"),
      ]);
      setTodayData(todayRes.data);
      setSummary(summaryRes.data.data);
      setRecentOrders(ordersRes.data.data);
    } catch {
      setError(true);
      if (isRefresh) toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // ── Loading ──
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p
            className={`text-xs font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Loading dashboard
          </p>
        </div>
      </div>
    );

  // ── Error ──
  if (error)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <HiOutlineExclamationCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p
            className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Failed to load data
          </p>
          <button
            onClick={() => fetchData()}
            className="btn-primary text-sm px-5 py-2.5"
          >
            Try again
          </button>
        </div>
      </div>
    );

  const stats = todayData?.stats || {};
  const monthRevenue = summary?.thisMonth?.revenue || 0;
  const monthCollected = summary?.thisMonth?.collected || 0;

  return (
    <div className="space-y-7 animate-fade-in pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {new Date().toLocaleDateString("en-NG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1
            className={`text-2xl font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {getGreeting()},{" "}
            <span className="text-primary-500">
              {user?.name?.split(" ")[0]}
            </span>
          </h1>
          <p
            className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Here's your business snapshot for today.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${
              isDark
                ? "bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400"
                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
            }`}
          >
            <HiOutlineRefresh
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => navigate("/orders/create")}
            className="btn-primary text-sm px-4 py-2.5 h-10"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Orders"
          value={todayData?.totalOrders || 0}
          prefix=""
          change={12}
          icon={HiOutlineShoppingBag}
          color="#22c55e"
          sparkValue={todayData?.totalOrders || 0}
          sparkMax={20}
          isDark={isDark}
        />
        <StatCard
          title="Revenue"
          value={stats.totalRevenue || 0}
          prefix="₦"
          change={8}
          icon={HiOutlineCurrencyDollar}
          color="#3b82f6"
          sparkValue={stats.totalRevenue || 0}
          sparkMax={50000}
          isDark={isDark}
        />
        <StatCard
          title="Collected"
          value={stats.totalCollected || 0}
          prefix="₦"
          change={5}
          icon={HiOutlineCheckCircle}
          color="#8b5cf6"
          sparkValue={stats.totalCollected || 0}
          sparkMax={50000}
          isDark={isDark}
        />
        <StatCard
          title="Outstanding"
          value={stats.totalBalance || 0}
          prefix="₦"
          change={-3}
          icon={HiOutlineClock}
          color="#f59e0b"
          sparkValue={stats.totalBalance || 0}
          sparkMax={50000}
          isDark={isDark}
        />
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders — takes 2 cols */}
        <div
          className={`lg:col-span-2 rounded-2xl border ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
          }`}
        >
          {/* Card Header */}
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? "border-gray-800" : "border-gray-100"
            }`}
          >
            <div>
              <h2
                className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Recent Orders
              </h2>
              <p
                className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              >
                Latest {recentOrders.length} transactions
              </p>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className={`flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors px-3 py-1.5 rounded-lg ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
              }`}
            >
              View all
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Orders List */}
          <RevenueChart />
          <div className="p-2">
            {recentOrders.length === 0 ? (
              <EmptyOrders
                isDark={isDark}
                onCreateOrder={() => navigate("/orders/create")}
              />
            ) : (
              recentOrders.map((order, i) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  isDark={isDark}
                  index={i}
                  onClick={() => navigate(`/orders/${order._id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Monthly Performance */}
          <div
            className={`rounded-2xl border p-5 ${
              isDark
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Monthly Performance
                </h2>
                <p
                  className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {new Date().toLocaleDateString("en-NG", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                className={`p-1.5 rounded-lg ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
              >
                <HiOutlineDotsVertical
                  className={`w-4 h-4 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                />
              </button>
            </div>

            <div className="space-y-5">
              <ProgressBar
                label="Revenue collected"
                value={monthCollected}
                total={monthRevenue || 1}
                color="#22c55e"
                isDark={isDark}
              />
              <ProgressBar
                label="Outstanding balance"
                value={Math.max(0, monthRevenue - monthCollected)}
                total={monthRevenue || 1}
                color="#f59e0b"
                isDark={isDark}
              />
            </div>

            {/* Summary Numbers */}
            <div
              className={`grid grid-cols-2 gap-3 mt-5 pt-5 border-t ${
                isDark ? "border-gray-800" : "border-gray-100"
              }`}
            >
              {[
                {
                  label: "This week",
                  value: `₦${(summary?.thisWeek?.revenue || 0).toLocaleString()}`,
                  sub: `${summary?.thisWeek?.orders || 0} orders`,
                },
                {
                  label: "This month",
                  value: `₦${(summary?.thisMonth?.revenue || 0).toLocaleString()}`,
                  sub: `${summary?.thisMonth?.orders || 0} orders`,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-600" : "text-gray-400"}`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-base font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {item.value}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                  >
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Source Breakdown */}
          {recentOrders.length > 0 && (
            <SourceBreakdown orders={recentOrders} isDark={isDark} />
          )}

          {/* Quick Actions */}
          <div></div>

          {/* Quick Actions */}
          <div
            className={`rounded-2xl border p-5 ${
              isDark
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-100"
            }`}
          >
            <h2
              className={`text-sm font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  label: "Create new order",
                  sub: "Add a customer order",
                  icon: HiOutlinePlus,
                  color: "#22c55e",
                  action: () => navigate("/orders/create"),
                },
                {
                  label: "View all orders",
                  sub: "Browse order history",
                  icon: HiOutlineShoppingBag,
                  color: "#3b82f6",
                  action: () => navigate("/orders"),
                },
                {
                  label: "Refresh dashboard",
                  sub: "Pull latest data",
                  icon: HiOutlineRefresh,
                  color: "#8b5cf6",
                  action: () => fetchData(true),
                },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 active:scale-[0.98] ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <action.icon
                      className="w-4 h-4"
                      style={{ color: action.color }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {action.label}
                    </p>
                    <p
                      className={`text-[10px] truncate ${isDark ? "text-gray-600" : "text-gray-400"}`}
                    >
                      {action.sub}
                    </p>
                  </div>
                  <HiOutlineArrowRight
                    className={`w-3.5 h-3.5 ml-auto flex-shrink-0 ${
                      isDark ? "text-gray-700" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
