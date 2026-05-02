import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineShoppingCart,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
} from "react-icons/hi";

// ── Source config — single source of truth for both the
// form select and the dashboard breakdown chart.
// Defined here once, imported nowhere — keeps the bundle lean.
const SOURCE_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp", emoji: "💬" },
  { value: "instagram", label: "Instagram", emoji: "📸" },
  { value: "facebook", label: "Facebook", emoji: "👥" },
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "website", label: "Website", emoji: "🌐" },
  { value: "walkin", label: "Walk-in", emoji: "🚶" },
  { value: "referral", label: "Referral", emoji: "🤝" },
  { value: "other", label: "Other", emoji: "📦" },
];

// ── Section wrapper — gives each form section visual breathing room ──
const Section = ({ icon: Icon, title, subtitle, children, isDark }) => (
  <div
    className={`rounded-2xl border overflow-hidden ${
      isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
    }`}
  >
    {/* Section Header */}
    <div
      className={`flex items-center gap-3 px-5 py-4 border-b ${
        isDark ? "border-gray-800" : "border-gray-100"
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
      >
        <Icon className="w-4 h-4 text-primary-500" />
      </div>
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
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ── Field wrapper — consistent label + input spacing ──────────
const Field = ({ label, required, children, hint, isDark }) => (
  <div className="space-y-1.5">
    <label
      className={`flex items-center gap-1 text-xs font-semibold ${
        isDark ? "text-gray-400" : "text-gray-600"
      }`}
    >
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && (
      <p
        className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}
      >
        {hint}
      </p>
    )}
  </div>
);

// ── Select input — consistent styling with native element ─────
const Select = ({ value, onChange, children, isDark }) => (
  <select
    value={value}
    onChange={onChange}
    className="input text-sm appearance-none cursor-pointer"
  >
    {children}
  </select>
);

// ── Order summary line item ───────────────────────────────────
const SummaryRow = ({ label, value, bold, color, isDark }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
      {label}
    </span>
    <span
      className={`text-sm font-${bold ? "bold" : "semibold"} ${
        color || (isDark ? "text-gray-200" : "text-gray-800")
      }`}
    >
      {value}
    </span>
  </div>
);

// ── Default shape for a new order item ───────────────────────
const newItem = () => ({
  id: Date.now(), // local key only — not sent to server
  name: "",
  quantity: 1,
  price: "",
});

// ── Main Component ────────────────────────────────────────────
const CreateOrder = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Customer info
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Items — start with one empty row, vendors almost always add at least one
  const [items, setItems] = useState([newItem()]);

  // Financials
  const [discount, setDiscount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  // Order meta
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [note, setNote] = useState("");
  const [source, setSource] = useState("whatsapp");

  const [submitting, setSubmitting] = useState(false);

  // ── Item mutations ────────────────────────────────────────
  const addItem = () => {
    setItems((prev) => [...prev, newItem()]);
  };

  const removeItem = (id) => {
    // Never allow zero items — a vendor always has at least one product
    if (items.length === 1) {
      toast.error("An order must have at least one item");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // ── Derived totals — recalculated on every render ─────────
  // No useEffect needed — these are pure computations from state
  const itemsSubtotal = items.reduce((sum, item) => {
    const qty = parseInt(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + qty * price;
  }, 0);

  const discountAmount = parseFloat(discount) || 0;
  const deliveryAmount = parseFloat(deliveryFee) || 0;
  const total = Math.max(0, itemsSubtotal - discountAmount + deliveryAmount);
  const paid = parseFloat(amountPaid) || 0;
  const balance = Math.max(0, total - paid);

  // ── Validation — explicit, not silent ────────────────────
  const validate = useCallback(() => {
    if (!customer.name.trim()) {
      toast.error("Customer name is required");
      return false;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name.trim()) {
        toast.error(`Item ${i + 1} needs a name`);
        return false;
      }
      if (!item.price || parseFloat(item.price) < 0) {
        toast.error(`Item ${i + 1} needs a valid price`);
        return false;
      }
      if (!item.quantity || parseInt(item.quantity) < 1) {
        toast.error(`Item ${i + 1} needs a valid quantity`);
        return false;
      }
    }
    if (paid > total && total > 0) {
      toast.error("Amount paid cannot exceed the total");
      return false;
    }
    return true;
  }, [customer, items, paid, total]);

  // ── Submission ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const payload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim() || undefined,
          address: customer.address.trim() || undefined,
        },
        items: items.map(({ name, quantity, price }) => ({
          name: name.trim(),
          quantity: parseInt(quantity),
          price: parseFloat(price),
        })),
        discount: discountAmount || undefined,
        deliveryFee: deliveryAmount || undefined,
        amountPaid: paid || undefined,
        paymentMethod,
        paymentStatus,
        deliveryType,
        note: note.trim() || undefined,
        source,
      };

      const { data } = await API.post("/orders", payload);

      toast.success(`Order ${data.data.orderNumber} created!`);
      navigate(`/orders/${data.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create order";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-10">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 mb-7">
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
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            New Order
          </h1>
          <p
            className={`text-sm mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Fill in the details below to create a new customer order
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Column (form) ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info */}
          <Section
            icon={HiOutlineUser}
            title="Customer Information"
            subtitle="Who is this order for?"
            isDark={isDark}
          >
            <div className="space-y-4">
              <Field
                label="Order Source"
                isDark={isDark}
                hint="Where did this sale come from?"
              >
                {/* Visual toggle grid — faster than a dropdown on mobile.
                    Vendors process orders quickly, they need one-tap selection. */}
                <div className="grid grid-cols-4 gap-2">
                  {SOURCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSource(opt.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all duration-150 active:scale-95 ${
                        source === opt.value
                          ? "border-primary-500 bg-primary-500/10"
                          : isDark
                            ? "border-gray-800 bg-gray-800/50 hover:bg-gray-800"
                            : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-base leading-none">
                        {opt.emoji}
                      </span>
                      <span
                        className={`text-[10px] font-semibold leading-none ${
                          source === opt.value
                            ? "text-primary-500"
                            : isDark
                              ? "text-gray-500"
                              : "text-gray-500"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Full Name" required isDark={isDark}>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Chioma Okafor"
                  className="input text-sm"
                  autoComplete="off"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone Number" isDark={isDark}>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="08012345678"
                    className="input text-sm"
                  />
                </Field>
                <Field label="Delivery Address" isDark={isDark}>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Street, area..."
                    className="input text-sm"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Order Items */}
          <Section
            icon={HiOutlineShoppingCart}
            title="Order Items"
            subtitle={`${items.length} item${items.length !== 1 ? "s" : ""} added`}
            isDark={isDark}
          >
            <div className="space-y-3">
              {/* Column Headers */}
              <div
                className={`grid grid-cols-12 gap-2 pb-1 text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}
              >
                <div className="col-span-5">Item Name</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-3">Price (₦)</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {/* Item Rows */}
              {items.map((item, index) => {
                const subtotal =
                  (parseInt(item.quantity) || 0) *
                  (parseFloat(item.price) || 0);
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? "border-gray-800 bg-gray-800/30"
                        : "border-gray-100 bg-gray-50/60"
                    }`}
                  >
                    {/* Name */}
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, "name", e.target.value)
                        }
                        placeholder={`Item ${index + 1}`}
                        className="input text-sm py-2 px-3"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, "quantity", e.target.value)
                        }
                        min="1"
                        className="input text-sm py-2 px-3 text-center"
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.id, "price", e.target.value)
                        }
                        placeholder="0"
                        min="0"
                        className="input text-sm py-2 px-3"
                      />
                    </div>

                    {/* Subtotal + Delete */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <span
                        className={`text-xs font-bold ${
                          subtotal > 0
                            ? isDark
                              ? "text-white"
                              : "text-gray-900"
                            : isDark
                              ? "text-gray-700"
                              : "text-gray-300"
                        }`}
                      >
                        {subtotal > 0 ? `₦${subtotal.toLocaleString()}` : "—"}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                          isDark
                            ? "text-gray-700 hover:text-red-400 hover:bg-red-500/10"
                            : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Item */}
              <button
                onClick={addItem}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all duration-200 ${
                  isDark
                    ? "border-gray-800 text-gray-600 hover:border-primary-500/50 hover:text-primary-400 hover:bg-primary-500/5"
                    : "border-gray-200 text-gray-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50"
                }`}
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add another item
              </button>
            </div>
          </Section>

          {/* Payment */}
          <Section
            icon={HiOutlineCurrencyDollar}
            title="Payment Details"
            subtitle="How is this order being paid?"
            isDark={isDark}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Payment Method" isDark={isDark}>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    isDark={isDark}
                  >
                    <option value="cash">Cash</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field label="Payment Status" isDark={isDark}>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    isDark={isDark}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Fully Paid</option>
                    <option value="partial">Partial Payment</option>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Discount (₦)" isDark={isDark} hint="Optional">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input text-sm"
                  />
                </Field>
                <Field label="Delivery Fee (₦)" isDark={isDark} hint="Optional">
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input text-sm"
                  />
                </Field>
                <Field
                  label="Amount Paid (₦)"
                  isDark={isDark}
                  hint="Leave 0 if unpaid"
                >
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input text-sm"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Delivery + Notes */}
          <Section
            icon={HiOutlineTruck}
            title="Delivery & Notes"
            subtitle="Optional extra details"
            isDark={isDark}
          >
            <div className="space-y-4">
              <Field label="Delivery Type" isDark={isDark}>
                {/* Toggle buttons instead of a dropdown — faster for mobile vendors */}
                <div
                  className={`flex rounded-xl border overflow-hidden ${
                    isDark ? "border-gray-800" : "border-gray-200"
                  }`}
                >
                  {["pickup", "delivery"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setDeliveryType(type)}
                      className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all duration-150 ${
                        deliveryType === type
                          ? "bg-primary-500 text-white"
                          : isDark
                            ? "bg-gray-900 text-gray-400 hover:bg-gray-800"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Order Note"
                isDark={isDark}
                hint="Any special instructions for this order"
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Extra spicy, no onions, call before delivery..."
                  rows={3}
                  maxLength={500}
                  className="input text-sm resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span
                    className={`text-[10px] ${
                      note.length > 450
                        ? "text-amber-500"
                        : isDark
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                  >
                    {note.length}/500
                  </span>
                </div>
              </Field>
            </div>
          </Section>
        </div>

        {/* ── Right Column (summary — sticky on desktop) ── */}
        <div className="space-y-4">
          <div
            className={`rounded-2xl border sticky top-24 ${
              isDark
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-100"
            }`}
          >
            {/* Summary Header */}
            <div
              className={`flex items-center gap-3 px-5 py-4 border-b ${
                isDark ? "border-gray-800" : "border-gray-100"
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
              >
                <HiOutlineClipboardList className="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Order Summary
                </p>
                <p
                  className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  Live calculation
                </p>
              </div>
            </div>

            <div className="p-5 space-y-1">
              {/* Items breakdown */}
              {items
                .filter((i) => i.name && i.price)
                .map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1"
                  >
                    <span
                      className={`text-xs truncate max-w-[60%] ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.name || `Item ${i + 1}`}
                      {item.quantity > 1 && (
                        <span className="ml-1 opacity-60">
                          ×{item.quantity}
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      ₦
                      {(
                        (parseInt(item.quantity) || 0) *
                        (parseFloat(item.price) || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}

              {/* Divider */}
              <div
                className={`border-t my-3 ${isDark ? "border-gray-800" : "border-gray-100"}`}
              />

              {/* Totals */}
              <SummaryRow
                label="Subtotal"
                value={`₦${itemsSubtotal.toLocaleString()}`}
                isDark={isDark}
              />
              {discountAmount > 0 && (
                <SummaryRow
                  label="Discount"
                  value={`-₦${discountAmount.toLocaleString()}`}
                  color="text-emerald-500"
                  isDark={isDark}
                />
              )}
              {deliveryAmount > 0 && (
                <SummaryRow
                  label="Delivery fee"
                  value={`+₦${deliveryAmount.toLocaleString()}`}
                  isDark={isDark}
                />
              )}

              {/* Total */}
              <div
                className={`border-t pt-3 mt-2 ${isDark ? "border-gray-800" : "border-gray-100"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Total
                  </span>
                  <span className="text-lg font-bold text-primary-500">
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment status */}
              {paid > 0 && (
                <div
                  className={`border-t pt-3 mt-1 space-y-1 ${isDark ? "border-gray-800" : "border-gray-100"}`}
                >
                  <SummaryRow
                    label="Amount paid"
                    value={`₦${paid.toLocaleString()}`}
                    color="text-emerald-500"
                    isDark={isDark}
                  />
                  <SummaryRow
                    label="Balance due"
                    value={`₦${balance.toLocaleString()}`}
                    color={balance > 0 ? "text-amber-500" : "text-emerald-500"}
                    bold
                    isDark={isDark}
                  />
                </div>
              )}
            </div>

            {/* Source preview in summary */}
            <div
              className={`mx-5 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl ${
                isDark ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <span className="text-sm">
                {SOURCE_OPTIONS.find((s) => s.value === source)?.emoji}
              </span>
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  Sale Source
                </p>
                <p
                  className={`text-xs font-semibold ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {SOURCE_OPTIONS.find((s) => s.value === source)?.label}
                </p>
              </div>
            </div>

            {/* Customer preview */}
            {customer.name && (
              <div
                className={`mx-5 mb-4 p-3 rounded-xl ${
                  isDark ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
                    isDark ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  Customer
                </p>
                <p
                  className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}
                >
                  {customer.name}
                </p>
                {customer.phone && (
                  <p
                    className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {customer.phone}
                  </p>
                )}
                {customer.address && (
                  <p
                    className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {customer.address}
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="px-5 pb-5">
              <button
                onClick={handleSubmit}
                disabled={submitting || items.every((i) => !i.name)}
                className="btn-primary w-full h-12 text-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating order...
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Create Order
                  </>
                )}
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="btn-secondary w-full h-10 text-sm mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
