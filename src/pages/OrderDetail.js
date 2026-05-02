import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
} from "react-icons/hi";
import { IoCopyOutline } from "react-icons/io5";
import { IoLogoWhatsapp } from "react-icons/io5";

// ── Status pipeline — the natural flow of an order's life ────
// Vendors think in terms of "what happens next", not abstract states.
// This ordering reflects real business workflow.
const STATUS_PIPELINE = [
  {
    key: "pending",
    label: "Pending",
    color: "#f59e0b",
    desc: "Waiting to be confirmed",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    color: "#3b82f6",
    desc: "Order accepted",
  },
  {
    key: "processing",
    label: "Processing",
    color: "#8b5cf6",
    desc: "Being prepared",
  },
  {
    key: "completed",
    label: "Completed",
    color: "#22c55e",
    desc: "Delivered successfully",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    color: "#ef4444",
    desc: "Order cancelled",
  },
];

const PAYMENT_STATUS = [
  { key: "unpaid", label: "Unpaid", color: "#ef4444" },
  { key: "partial", label: "Partial", color: "#f59e0b" },
  { key: "paid", label: "Paid", color: "#22c55e" },
];

// ── Utility: human-readable timestamps ───────────────────────
// Relative time matters more than exact time for vendors
// checking recent orders on their phone.
const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatFullDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ── Info Row — label + value pair, used throughout ───────────
const InfoRow = ({ label, value, accent, isDark }) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <span
      className={`text-xs flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}
    >
      {label}
    </span>
    <span
      className={`text-xs font-semibold text-right ${
        accent ? accent : isDark ? "text-gray-200" : "text-gray-800"
      }`}
    >
      {value}
    </span>
  </div>
);

// ── Section card — consistent container ──────────────────────
const Card = ({ children, isDark, className = "" }) => (
  <div
    className={`rounded-2xl border ${
      isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
    } ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, action, isDark }) => (
  <div
    className={`flex items-center justify-between px-5 py-4 border-b ${
      isDark ? "border-gray-800" : "border-gray-100"
    }`}
  >
    <div>
      <p
        className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {title}
      </p>
      {subtitle && (
        <p
          className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {action}
  </div>
);

// ── Status Step Indicator ─────────────────────────────────────
// Shows order progress visually — vendors immediately know
// where an order stands without reading text.
const StatusTracker = ({ currentStatus, isDark }) => {
  // Cancelled is handled separately — it breaks the linear flow
  const isCancelled = currentStatus === "cancelled";
  const pipeline = STATUS_PIPELINE.filter((s) => s.key !== "cancelled");
  const currentIndex = pipeline.findIndex((s) => s.key === currentStatus);

  if (isCancelled) {
    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-xl ${
          isDark
            ? "bg-red-500/10 border border-red-500/20"
            : "bg-red-50 border border-red-100"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <HiOutlineX className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-500">Order Cancelled</p>
          <p
            className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            This order has been cancelled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Step dots + connecting line */}
      <div className="flex items-center gap-0">
        {pipeline.map((step, i) => {
          const isDone = i <= currentIndex;
          const isActive = i === currentIndex;
          const isLast = i === pipeline.length - 1;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                {/* Dot */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? "ring-4 ring-offset-2" : ""
                  }`}
                  style={{
                    backgroundColor: isDone
                      ? step.color
                      : isDark
                        ? "#1f2937"
                        : "#f1f5f9",
                    ringColor: isActive ? `${step.color}30` : "transparent",
                    ringOffsetColor: isDark ? "#111827" : "white",
                  }}
                >
                  {isDone && !isActive ? (
                    <HiOutlineCheck className="w-3.5 h-3.5 text-white" />
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-300"}`}
                    />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    isDone
                      ? isActive
                        ? ""
                        : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                      : isDark
                        ? "text-gray-700"
                        : "text-gray-300"
                  }`}
                  style={isActive ? { color: step.color } : {}}
                >
                  {step.label}
                </span>
              </div>
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all duration-500 ${
                    i < currentIndex
                      ? "bg-primary-500"
                      : isDark
                        ? "bg-gray-800"
                        : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ── Partial Payment Modal ─────────────────────────────────────
// When a customer pays part of the balance, the vendor needs
// to record exactly how much was collected — not just a status.
const PartialPaymentModal = ({
  order,
  isDark,
  onConfirm,
  onCancel,
  loading,
  value,
  onChange,
}) => {
  const remaining = order.totalAmount - (order.amountPaid || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl p-6 animate-slide-up ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <HiOutlineCurrencyDollar className="w-6 h-6 text-amber-500" />
        </div>

        <h3
          className={`text-base font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Record Partial Payment
        </h3>
        <p
          className={`text-xs text-center mt-1.5 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          How much did the customer pay?
        </p>

        {/* Context numbers — vendor needs to see this while typing */}
        <div
          className={`grid grid-cols-2 gap-3 my-5 p-3 rounded-xl ${
            isDark ? "bg-gray-800" : "bg-gray-50"
          }`}
        >
          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Order Total
            </p>
            <p
              className={`text-sm font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              ₦{order.totalAmount?.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Still Owed
            </p>
            <p className="text-sm font-bold mt-1 text-amber-500">
              ₦{remaining?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5 mb-5">
          <label
            className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Amount Received (₦)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter amount paid"
            min="1"
            max={order.totalAmount}
            className="input text-sm"
            autoFocus
          />
          {/* Quick amount buttons — saves typing for common amounts */}
          {remaining > 0 && (
            <div className="flex gap-2 mt-2">
              {[
                { label: "Half", value: Math.floor(remaining / 2) },
                { label: "Full", value: remaining },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onChange(String(preset.value))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isDark
                      ? "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                  }`}
                >
                  {preset.label} (₦{preset.value?.toLocaleString()})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview — vendor sees balance before confirming */}
        {value && parseFloat(value) > 0 && (
          <div
            className={`p-3 rounded-xl mb-5 ${
              isDark ? "bg-gray-800" : "bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                New balance after this payment:
              </span>
              <span
                className={`text-sm font-bold ${
                  Math.max(0, remaining - parseFloat(value)) === 0
                    ? "text-emerald-500"
                    : "text-amber-500"
                }`}
              >
                ₦{Math.max(0, remaining - parseFloat(value)).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 h-10 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !value || parseFloat(value) <= 0}
            className="btn-primary flex-1 h-10 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Record Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirmation Modal ─────────────────────────────────
// Inline modal — no library needed, keeps bundle lean.
const DeleteModal = ({ isDark, onConfirm, onCancel, loading }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
  >
    <div
      className={`w-full max-w-sm rounded-2xl border shadow-2xl p-6 animate-slide-up ${
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <HiOutlineTrash className="w-6 h-6 text-red-500" />
      </div>
      <h3
        className={`text-base font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}
      >
        Delete this order?
      </h3>
      <p
        className={`text-xs text-center mt-2 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        This will soft-delete the order. It won't appear in your dashboard but
        the data is preserved.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1 h-10 text-sm"
        >
          Keep it
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn-danger flex-1 h-10 text-sm"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Yes, delete"
          )}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
const OrderDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await API.get(`/orders/${id}`);
      setOrder(data.data);
      setNoteValue(data.data.note || "");
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Order not found");
        navigate("/orders");
      } else {
        toast.error("Failed to load order");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Status Update ─────────────────────────────────────────
  // Optimistic update — UI changes instantly, rolls back on error.
  // This makes the app feel native, not web-slow.
  const updateStatus = async (newStatus) => {
    if (newStatus === order.status) return;
    const previous = order.status;
    setOrder((prev) => ({ ...prev, status: newStatus })); // optimistic

    setUpdating(true);
    try {
      const { data } = await API.put(`/orders/${id}`, { status: newStatus });
      setOrder(data.data);
      toast.success(`Order marked as ${newStatus}`);
    } catch {
      setOrder((prev) => ({ ...prev, status: previous })); // rollback
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // ── Payment Status Update ─────────────────────────────────
  const updatePayment = async (newPaymentStatus) => {
    if (newPaymentStatus === order.paymentStatus) return;

    // Partial payment needs extra info — how much was collected?
    // Show modal instead of updating directly.
    if (newPaymentStatus === "partial") {
      setPartialAmount("");
      setShowPartialModal(true);
      return;
    }

    const previous = {
      paymentStatus: order.paymentStatus,
      amountPaid: order.amountPaid,
      balance: order.balance,
    };

    setOrder((prev) => ({
      ...prev,
      paymentStatus: newPaymentStatus,
      amountPaid:
        newPaymentStatus === "paid" ? prev.totalAmount : prev.amountPaid,
      balance: newPaymentStatus === "paid" ? 0 : prev.balance,
    }));

    setUpdating(true);
    try {
      const { data } = await API.put(`/orders/${id}`, {
        paymentStatus: newPaymentStatus,
        ...(newPaymentStatus === "paid" && { amountPaid: order.totalAmount }),
      });
      setOrder(data.data);
      toast.success(
        newPaymentStatus === "paid"
          ? `₦${order.totalAmount?.toLocaleString()} fully collected ✅`
          : `Payment marked as ${newPaymentStatus}`,
      );
    } catch {
      setOrder((prev) => ({ ...prev, ...previous }));
      toast.error("Failed to update payment");
    } finally {
      setUpdating(false);
    }
  };

  // ── Partial Payment Submission ────────────────────────────
  // Separated from updatePayment because it needs extra validation
  // and a different payload — the amount collected.
  const submitPartialPayment = async () => {
    const amount = parseFloat(partialAmount);

    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > order.totalAmount) {
      toast.error("Amount cannot exceed order total");
      return;
    }

    const totalPaid = (order.amountPaid || 0) + amount;
    // Auto-upgrade to fully paid if collected amount covers total
    const newStatus = totalPaid >= order.totalAmount ? "paid" : "partial";

    setUpdating(true);
    try {
      const { data } = await API.put(`/orders/${id}`, {
        paymentStatus: newStatus,
        amountPaid: Math.min(totalPaid, order.totalAmount),
      });
      setOrder(data.data);
      setShowPartialModal(false);
      setPartialAmount("");

      toast.success(
        newStatus === "paid"
          ? `Order fully paid! ₦${order.totalAmount?.toLocaleString()} collected ✅`
          : `₦${amount.toLocaleString()} recorded. Balance: ₦${(order.totalAmount - totalPaid).toLocaleString()}`,
      );
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setUpdating(false);
    }
  };

  // ── Note Update ───────────────────────────────────────────
  const saveNote = async () => {
    setUpdating(true);
    try {
      const { data } = await API.put(`/orders/${id}`, { note: noteValue });
      setOrder(data.data);
      setEditingNote(false);
      toast.success("Note updated");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/orders/${id}`);
      toast.success("Order deleted");
      navigate("/orders");
    } catch {
      toast.error("Failed to delete order");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── Copy order number to clipboard ───────────────────────
  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    toast.success("Order number copied!");
  };

  // WhatsApp message — crafted to feel human, not robotic.
  // Vendors send this to customers directly, so it must read
  // naturally, not like a system-generated receipt.
  const shareOnWhatsApp = () => {
    const paymentIcon =
      {
        paid: "✅",
        partial: "⏳",
        unpaid: "🔴",
      }[order.paymentStatus] || "🔴";

    const statusIcon =
      {
        pending: "🕐",
        confirmed: "✅",
        processing: "🔄",
        completed: "🎉",
        cancelled: "❌",
      }[order.status] || "🕐";

    const itemsList = order.items
      ?.map(
        (item) =>
          `  • ${item.name} × ${item.quantity} — ₦${item.subtotal?.toLocaleString()}`,
      )
      .join("\n");

    // Each section separated by blank line — WhatsApp renders
    // line breaks only when there's an actual \n\n between blocks.
    // Single \n collapses into a space on some devices.
    const lines = [];

    lines.push(`Hello *${order.customer?.name}* 👋`);
    lines.push(`Thank you for your order! Here's your summary:`);
    lines.push("");

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(` *ORDER DETAILS*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push("");

    lines.push(` *Order No:* ${order.orderNumber}`);
    lines.push(
      `${statusIcon} *Status:* ${order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}`,
    );
    lines.push(
      ` *Delivery:* ${order.deliveryType === "delivery" ? "Home Delivery" : "Pickup"}`,
    );
    lines.push("");

    lines.push(` *ITEMS ORDERED*`);
    lines.push(`─────────────────────`);
    lines.push(itemsList);
    lines.push(`─────────────────────`);
    lines.push("");

    lines.push(` *PAYMENT SUMMARY*`);
    lines.push(`─────────────────────`);
    lines.push(`Subtotal:       ₦${order.subtotal?.toLocaleString()}`);

    if (order.discount > 0) {
      lines.push(`Discount:       -₦${order.discount?.toLocaleString()}`);
    }
    if (order.deliveryFee > 0) {
      lines.push(`Delivery fee:   ₦${order.deliveryFee?.toLocaleString()}`);
    }

    lines.push(`─────────────────────`);
    lines.push(`*TOTAL:         ₦${order.totalAmount?.toLocaleString()}*`);
    lines.push("");
    lines.push(
      `${paymentIcon} *Payment Status:* ${order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}`,
    );

    if (order.amountPaid > 0 && order.paymentStatus !== "paid") {
      lines.push(` Amount Paid:  ₦${order.amountPaid?.toLocaleString()}`);
    }
    if (order.balance > 0) {
      lines.push(` *Balance Due: ₦${order.balance?.toLocaleString()}*`);
    }

    if (order.note) {
      lines.push("");
      lines.push(` *NOTE*`);
      lines.push(`─────────────────────`);
      lines.push(order.note);
    }

    lines.push("");
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_We appreciate your business!_ `);
    lines.push(`_Powered by OrderManager_`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);

    const message = lines.join("\n");

    const phone = order.customer?.phone
      ?.replace(/\D/g, "")
      ?.replace(/^0/, "234");

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  // LOADING
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <p
            className={`text-xs font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Loading order
          </p>
        </div>
      </div>
    );

  if (!order) return null;

  const currentStatusConfig = STATUS_PIPELINE.find(
    (s) => s.key === order.status,
  );

  return (
    <>
      {showPartialModal && (
        <PartialPaymentModal
          order={order}
          isDark={isDark}
          value={partialAmount}
          onChange={setPartialAmount}
          onConfirm={submitPartialPayment}
          onCancel={() => setShowPartialModal(false)}
          loading={updating}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isDark={isDark}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
        />
      )}

      <div className="max-w-4xl mx-auto animate-fade-in pb-10 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/orders")}
              className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-95 flex-shrink-0 ${
                isDark
                  ? "bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400"
                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
              }`}
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {order.orderNumber}
                </h1>
                <button
                  onClick={copyOrderNumber}
                  className={`p-1 rounded-lg transition-colors ${
                    isDark
                      ? "text-gray-600 hover:text-gray-400"
                      : "text-gray-300 hover:text-gray-500"
                  }`}
                >
                  <IoCopyOutline className="w-3.5 h-3.5" />
                </button>
                {/* Live status pill in header */}
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: currentStatusConfig?.color || "#6b7280",
                  }}
                >
                  {order.status}
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              >
                Created {formatRelativeTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* WhatsApp share — highest value action for Nigerian vendors */}
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-95 shadow-lg shadow-green-500/20"
              style={{ backgroundColor: "#25D366" }}
            >
              <IoLogoWhatsapp className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={fetchOrder}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? "bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400"
                  : "bg-white border-gray-200 hover:bg-gray-50 text-gray-500"
              }`}
            >
              <HiOutlineRefresh className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? "bg-gray-900 border-gray-800 hover:bg-red-500/10 hover:border-red-500/30 text-gray-400 hover:text-red-400"
                  : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500"
              }`}
            >
              <HiOutlineTrash className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: Main Content ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status Tracker */}
            <Card isDark={isDark}>
              <CardHeader
                title="Order Progress"
                subtitle="Update the current status of this order"
                isDark={isDark}
                action={
                  updating && (
                    <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                  )
                }
              />
              <div className="p-5 space-y-5">
                <StatusTracker currentStatus={order.status} isDark={isDark} />

                {/* Status Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_PIPELINE.filter((s) => s.key !== order.status).map(
                    (step) => (
                      <button
                        key={step.key}
                        onClick={() => updateStatus(step.key)}
                        disabled={updating}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 active:scale-95 disabled:opacity-40 ${
                          isDark
                            ? "border-gray-800 hover:border-gray-700 bg-gray-800/50 hover:bg-gray-800"
                            : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: step.color }}
                        />
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-600"}
                        >
                          Mark {step.label}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card isDark={isDark}>
              <CardHeader
                title="Order Items"
                subtitle={`${order.items?.length} item${order.items?.length !== 1 ? "s" : ""} ordered`}
                isDark={isDark}
              />
              <div className="p-2">
                {/* Items Header */}
                <div
                  className={`grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-3 text-right">Subtotal</div>
                </div>

                {/* Items */}
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl ${
                      isDark ? "hover:bg-gray-800/40" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isDark
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-sm font-semibold truncate ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        ×{item.quantity}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        ₦{item.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span
                        className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        ₦{item.subtotal?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div
                  className={`mx-4 mt-2 pt-4 border-t space-y-2 ${
                    isDark ? "border-gray-800" : "border-gray-100"
                  }`}
                >
                  <div className="flex justify-between">
                    <span
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Subtotal
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      ₦{order.subtotal?.toLocaleString()}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span
                        className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        Discount
                      </span>
                      <span className="text-sm font-semibold text-emerald-500">
                        -₦{order.discount?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span
                        className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        Delivery fee
                      </span>
                      <span
                        className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        +₦{order.deliveryFee?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex justify-between pt-2 border-t ${
                      isDark ? "border-gray-800" : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Total
                    </span>
                    <span className="text-base font-bold text-primary-500">
                      ₦{order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment summary */}
                <div
                  className={`mx-4 mt-3 p-4 rounded-xl ${
                    isDark ? "bg-gray-800/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Payment Summary
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : order.paymentStatus === "partial"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                  </div>

                  {/* Payment bar */}
                  <div
                    className={`h-1.5 rounded-full overflow-hidden mb-2 ${
                      isDark ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          order.totalAmount > 0
                            ? (order.amountPaid / order.totalAmount) * 100
                            : 0,
                        )}%`,
                        backgroundColor:
                          order.paymentStatus === "paid"
                            ? "#22c55e"
                            : order.paymentStatus === "partial"
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    />
                  </div>

                  <div className="flex justify-between">
                    <span
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Paid:{" "}
                      <span className="font-semibold text-emerald-500">
                        ₦{order.amountPaid?.toLocaleString()}
                      </span>
                    </span>
                    {order.balance > 0 && (
                      <span
                        className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        Balance:{" "}
                        <span className="font-semibold text-amber-500">
                          ₦{order.balance?.toLocaleString()}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Note */}
            <Card isDark={isDark}>
              <CardHeader
                title="Order Note"
                subtitle="Special instructions or remarks"
                isDark={isDark}
                action={
                  !editingNote ? (
                    <button
                      onClick={() => setEditingNote(true)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        isDark
                          ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      }`}
                    >
                      <HiOutlinePencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingNote(false);
                          setNoteValue(order.note || "");
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark
                            ? "hover:bg-gray-800 text-gray-500"
                            : "hover:bg-gray-50 text-gray-400"
                        }`}
                      >
                        <HiOutlineX className="w-4 h-4" />
                      </button>
                      <button
                        onClick={saveNote}
                        disabled={updating}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                      >
                        <HiOutlineCheck className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  )
                }
              />
              <div className="p-5">
                {editingNote ? (
                  <textarea
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="Add a note for this order..."
                    rows={3}
                    maxLength={500}
                    className="input text-sm resize-none"
                    autoFocus
                  />
                ) : order.note ? (
                  <p
                    className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {order.note}
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm italic ${isDark ? "text-gray-600" : "text-gray-300"}`}
                    >
                      No note added
                    </p>
                    <button
                      onClick={() => setEditingNote(true)}
                      className="text-xs text-primary-500 font-semibold hover:text-primary-600"
                    >
                      Add one
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right: Sidebar Info ── */}
          <div className="space-y-5">
            {/* Customer */}
            <Card isDark={isDark}>
              <CardHeader title="Customer" isDark={isDark} />
              <div className="p-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{
                      background: `hsl(${(order.customer?.name?.charCodeAt(0) || 65) * 5}, 55%, 42%)`,
                    }}
                  >
                    {order.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {order.customer?.name}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Customer
                    </p>
                  </div>
                </div>

                <div
                  className={`space-y-0 divide-y ${isDark ? "divide-gray-800" : "divide-gray-50"}`}
                >
                  {order.customer?.phone && (
                    <div className="flex items-center gap-2.5 py-2.5">
                      <HiOutlinePhone
                        className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <span
                        className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {order.customer.phone}
                      </span>
                    </div>
                  )}
                  {order.customer?.address && (
                    <div className="flex items-start gap-2.5 py-2.5">
                      <HiOutlineLocationMarker
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <span
                        className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {order.customer.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Payment Control */}
            <Card isDark={isDark}>
              <CardHeader
                title="Payment"
                subtitle="Update payment status"
                isDark={isDark}
              />
              <div className="p-4 space-y-2">
                {PAYMENT_STATUS.map((ps) => (
                  <button
                    key={ps.key}
                    onClick={() => updatePayment(ps.key)}
                    disabled={updating}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-[0.98] disabled:opacity-40 ${
                      order.paymentStatus === ps.key
                        ? "text-white border-transparent"
                        : isDark
                          ? "border-gray-800 bg-gray-800/50 text-gray-400 hover:bg-gray-800"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                    style={
                      order.paymentStatus === ps.key
                        ? { backgroundColor: ps.color, borderColor: ps.color }
                        : {}
                    }
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          order.paymentStatus === ps.key ? "white" : ps.color,
                      }}
                    />
                    {ps.label}
                    {order.paymentStatus === ps.key && (
                      <HiOutlineCheck className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Order Meta */}
            <Card isDark={isDark}>
              <CardHeader title="Details" isDark={isDark} />
              <div
                className={`px-5 divide-y ${isDark ? "divide-gray-800" : "divide-gray-50"}`}
              >
                <InfoRow
                  label="Order No."
                  value={order.orderNumber}
                  isDark={isDark}
                />
                <InfoRow
                  label="Delivery"
                  value={
                    order.deliveryType === "delivery"
                      ? "🚚 Delivery"
                      : "🏪 Pickup"
                  }
                  isDark={isDark}
                />

                <InfoRow
                  label="Source"
                  value={`${
                    {
                      whatsapp: "💬 WhatsApp",
                      instagram: "📸 Instagram",
                      facebook: "👥 Facebook",
                      tiktok: "🎵 TikTok",
                      website: "🌐 Website",
                      walkin: "🚶 Walk-in",
                      referral: "🤝 Referral",
                      other: "📦 Other",
                    }[order.source] || "💬 WhatsApp"
                  }`}
                  isDark={isDark}
                />
                <InfoRow
                  label="Payment via"
                  value={
                    order.paymentMethod?.charAt(0).toUpperCase() +
                    order.paymentMethod?.slice(1)
                  }
                  isDark={isDark}
                />
                <InfoRow
                  label="Created"
                  value={formatRelativeTime(order.createdAt)}
                  isDark={isDark}
                />
                <InfoRow
                  label="Last updated"
                  value={formatRelativeTime(order.updatedAt)}
                  isDark={isDark}
                />
              </div>
              {/* Full timestamp at bottom — secondary info */}
              <div
                className={`px-5 py-3 ${isDark ? "text-gray-700" : "text-gray-300"}`}
              >
                <p className="text-[10px]">{formatFullDate(order.createdAt)}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
