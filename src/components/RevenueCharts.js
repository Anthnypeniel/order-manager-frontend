import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HiOutlineTrendingUp, HiOutlineTrendingDown } from "react-icons/hi";

// ── Custom Tooltip — recharts default is generic and ugly ────
// We build our own so it matches the app's design language.
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className={`rounded-xl border shadow-xl px-4 py-3 min-w-[140px] ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {entry.name}
            </span>
          </div>
          <span
            className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {entry.name === "Orders"
              ? entry.value
              : `₦${Number(entry.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Custom Bar Shape — rounded tops feel more modern ─────────
const RoundedBar = (props) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const radius = Math.min(6, width / 2);

  return (
    <path
      d={`
        M ${x},${y + height}
        L ${x},${y + radius}
        Q ${x},${y} ${x + radius},${y}
        L ${x + width - radius},${y}
        Q ${x + width},${y} ${x + width},${y + radius}
        L ${x + width},${y + height}
        Z
      `}
      fill={fill}
    />
  );
};

// ── Main Chart Component ──────────────────────────────────────
const RevenueChart = () => {
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState("revenue");
  const [trend, setTrend] = useState({ value: 0, isPositive: true });

  const buildLast7Days = useCallback(async () => {
    try {
      // Build last 7 days date range
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
      }

      // Fetch orders for each day in parallel
      // Each request is scoped to that vendor via JWT — no leakage
      const results = await Promise.all(
        days.map(async (date, index) => {
          const i = 6 - index; // 6 = today, 0 = 6 days ago
          const start = new Date(date);
          start.setHours(0, 0, 0, 0);
          const end = new Date(date);
          end.setHours(23, 59, 59, 999);

          try {
            const { data } = await API.get("/orders", {
              params: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                limit: 100,
              },
            });

            const orders = data.data || [];
            const revenue = orders
              .filter((o) => o.status !== "cancelled")
              .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            const collected = orders
              .filter((o) => o.status !== "cancelled")
              .reduce((sum, o) => sum + (o.amountPaid || 0), 0);

            return {
              day: date.toLocaleDateString("en-NG", { weekday: "short" }),
              fullDate: date.toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "short",
              }),
              revenue,
              collected,
              orders: orders.filter((o) => o.status !== "cancelled").length,
              isToday: i === 0,
            };
          } catch {
            return {
              day: date.toLocaleDateString("en-NG", { weekday: "short" }),
              fullDate: "",
              revenue: 0,
              collected: 0,
              orders: 0,
              isToday: false,
            };
          }
        }),
      );

      setChartData(results);

      // Calculate week-over-week trend
      // Compare last 3 days vs 3 days before that
      const recent = results.slice(4).reduce((s, d) => s + d.revenue, 0);
      const previous = results.slice(1, 4).reduce((s, d) => s + d.revenue, 0);
      const trendValue =
        previous > 0
          ? Math.round(((recent - previous) / previous) * 100)
          : recent > 0
            ? 100
            : 0;

      setTrend({ value: Math.abs(trendValue), isPositive: trendValue >= 0 });
    } catch {
      // Silent fail — chart is supplementary, not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buildLast7Days();
  }, [buildLast7Days]);

  // ── Derived stats from chart data ────────────────────────
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);
  const bestDay = chartData.reduce(
    (best, d) => (d.revenue > best.revenue ? d : best),
    { revenue: 0, day: "—" },
  );

  const metrics = [
    { key: "revenue", label: "Revenue", color: "#22c55e" },
    { key: "collected", label: "Collected", color: "#3b82f6" },
    { key: "orders", label: "Orders", color: "#8b5cf6" },
  ];

  const activeColor =
    metrics.find((m) => m.key === activeMetric)?.color || "#22c55e";

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-6 ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}
      >
        <div className="animate-pulse space-y-4">
          <div
            className={`h-4 w-32 rounded ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
          />
          <div
            className={`h-48 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      {/* ── Header ── */}
      <div
        className={`flex items-start justify-between px-5 pt-5 pb-4 border-b ${
          isDark ? "border-gray-800" : "border-gray-100"
        }`}
      >
        <div>
          <h2
            className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            7-Day Performance
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p
              className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Last 7 days
            </p>
            {/* Trend indicator */}
            <div
              className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                trend.isPositive
                  ? isDark
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-emerald-50 text-emerald-600"
                  : isDark
                    ? "bg-red-500/10 text-red-400"
                    : "bg-red-50 text-red-500"
              }`}
            >
              {trend.isPositive ? (
                <HiOutlineTrendingUp className="w-3 h-3" />
              ) : (
                <HiOutlineTrendingDown className="w-3 h-3" />
              )}
              {trend.value}%
            </div>
          </div>
        </div>

        {/* Metric Switcher */}
        <div
          className={`flex rounded-xl overflow-hidden border ${
            isDark ? "border-gray-800" : "border-gray-200"
          }`}
        >
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                activeMetric === m.key
                  ? "text-white"
                  : isDark
                    ? "text-gray-500 hover:text-gray-300 bg-gray-900"
                    : "text-gray-400 hover:text-gray-600 bg-white"
              }`}
              style={activeMetric === m.key ? { backgroundColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div
        className={`grid grid-cols-3 divide-x ${
          isDark ? "divide-gray-800" : "divide-gray-100"
        }`}
      >
        {[
          {
            label: "7-Day Revenue",
            value: `₦${totalRevenue.toLocaleString()}`,
          },
          {
            label: "Total Orders",
            value: totalOrders,
          },
          {
            label: "Best Day",
            value: bestDay.day,
          },
        ].map((stat) => (
          <div key={stat.label} className="px-5 py-3">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {stat.label}
            </p>
            <p
              className={`text-base font-bold mt-0.5 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="px-2 pt-2 pb-5">
        {chartData.every((d) => d[activeMetric] === 0) ? (
          // No data state — honest, not misleading
          <div className="flex flex-col items-center justify-center h-48">
            <p
              className={`text-sm font-semibold ${isDark ? "text-gray-600" : "text-gray-300"}`}
            >
              No data for this period
            </p>
            <p
              className={`text-xs mt-1 ${isDark ? "text-gray-700" : "text-gray-300"}`}
            >
              Create orders to see your performance chart
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#1f2937" : "#f1f5f9"}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: isDark ? "#4b5563" : "#9ca3af",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: isDark ? "#4b5563" : "#9ca3af",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  activeMetric === "orders"
                    ? v
                    : v >= 1000
                      ? `₦${(v / 1000).toFixed(0)}k`
                      : `₦${v}`
                }
              />
              <Tooltip
                content={<CustomTooltip isDark={isDark} />}
                cursor={{
                  fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                  radius: 8,
                }}
              />
              <Bar
                dataKey={activeMetric}
                name={metrics.find((m) => m.key === activeMetric)?.label}
                fill={activeColor}
                shape={<RoundedBar />}
                // Today's bar gets full opacity, past days are slightly faded
                // This gives vendors instant visual context of recency
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
