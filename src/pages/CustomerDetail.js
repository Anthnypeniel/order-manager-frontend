import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import { IoLogoWhatsapp } from "react-icons/io5";

const StatusBadge = ({ status }) => {
  const map = {
    pending:    { bg: "bg-amber-50 dark:bg-amber-500/10",    text: "text-amber-600 dark:text-amber-400",    dot: "#f59e0b" },
    confirmed:  { bg: "bg-blue-50 dark:bg-blue-500/10",      text: "text-blue-600 dark:text-blue-400",      dot: "#3b82f6" },
    processing: { bg: "bg-purple-50 dark:bg-purple-500/10",  text: "text-purple-600 dark:text-purple-400",  dot: "#8b5cf6" },
    completed:  { bg: "bg-emerald-50 dark:bg-emerald-500/10",text: "text-emerald-600 dark:text-emerald-400",dot: "#22c55e" },
    cancelled:  { bg: "bg-red-50 dark:bg-red-500/10",        text: "text-red-500 dark:text-red-400",        dot: "#ef4444" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const CustomerDetail = () => {
  const { phone } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      const { data: res } = await API.get(`/customers/${phone}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        navigate("/customers");
      }
    } finally {
      setLoading(false);
    }
  }, [phone, navigate]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleWhatsApp = () => {
    if (!data?.customer?.phone) return;
    const cleanPhone = data.customer.phone
      .replace(/\D/g, "")
      .replace(/^0/, "234");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const handleNewOrder = () => {
    navigate("/orders/create", {
      state: {
        prefill: {
          name: data.customer.name,
          phone: data.customer.phone || "",
          address: data.customer.address || "",
        }
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-10 h-10 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { customer, summary, orders } = data;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/customers")}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
              isDark
                ? "bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400"
                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
            }`}
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: `hsl(${(customer.name?.charCodeAt(0) || 65) * 5}, 55%, 42%)` }}
            >
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {customer.name}
              </h1>
              <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Customer since {new Date(summary.firstOrder).toLocaleDateString("en-NG", {
                  month: "long", year: "numeric"
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {customer.phone && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ backgroundColor: "#25D366" }}
            >
              <IoLogoWhatsapp className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}
          <button
            onClick={handleNewOrder}
            className="btn-primary text-sm px-4 h-10"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </button>
        </div>
      </div>

      {/* Customer Info + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Contact Info */}
        <div className={`rounded-2xl border p-5 ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}>
            Contact Information
          </p>
          <div className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? "bg-gray-800" : "bg-gray-50"
                }`}>
                  <HiOutlinePhone className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <p className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  {customer.phone}
                </p>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-gray-800" : "bg-gray-50"
                }`}>
                  <HiOutlineLocationMarker className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  {customer.address}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className={`rounded-2xl border p-5 ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}>
            Financial Summary
          </p>
          <div className="space-y-3">
            {[
              { label: "Total Orders", value: summary.totalOrders, icon: HiOutlineShoppingBag, color: "#22c55e" },
              { label: "Total Spent", value: `₦${summary.totalSpent.toLocaleString()}`, icon: HiOutlineCurrencyDollar, color: "#3b82f6" },
              { label: "Amount Paid", value: `₦${summary.totalPaid.toLocaleString()}`, icon: HiOutlineCheckCircle, color: "#22c55e" },
              { label: "Outstanding", value: `₦${summary.totalBalance.toLocaleString()}`, icon: HiOutlineClock, color: summary.totalBalance > 0 ? "#f59e0b" : "#22c55e" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}>
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </div>
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className={`rounded-2xl border ${
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? "border-gray-800" : "border-gray-100"
        }`}>
          <div>
            <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Order History
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {orders.length} order{orders.length !== 1 ? "s" : ""} placed
            </p>
          </div>
        </div>

        <div className="p-2">
          {orders.map((order, i) => (
            <div
              key={order._id}
              onClick={() => navigate(`/orders/${order._id}`)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all group ${
                isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
              }`}>
                {orders.length - i}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                  {order.orderNumber}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {new Date(order.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric", month: "short", year: "numeric"
                  })} · {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  ₦{order.totalAmount?.toLocaleString()}
                </p>
                <p className={`text-[10px] mt-0.5 ${
                  order.paymentStatus === "paid" ? "text-emerald-500" :
                  order.paymentStatus === "partial" ? "text-amber-500" :
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}>
                  {order.paymentStatus}
                </p>
              </div>
              <HiOutlineArrowRight className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                isDark ? "text-gray-700" : "text-gray-300"
              }`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;