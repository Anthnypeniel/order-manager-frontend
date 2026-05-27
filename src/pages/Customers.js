import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlinePhone,
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClock,
} from "react-icons/hi";

// ── Format relative time ──────────────────────────────────────
const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// ── Customer Card ─────────────────────────────────────────────
const CustomerCard = ({ customer, isDark, onClick, onNewOrder }) => {
  const hasBalance = customer.totalBalance > 0;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group ${
        isDark
          ? "bg-gray-900 border-gray-800 hover:border-gray-700 hover:shadow-black/20"
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-gray-100"
      }`}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Customer header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar with color based on name */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{
                background: `hsl(${(customer.name?.charCodeAt(0) || 65) * 5}, 55%, 42%)`,
              }}
            >
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p
                className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {customer.name}
              </p>
              {customer.phone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <HiOutlinePhone
                    className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                  />
                  <p
                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {customer.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Outstanding balance badge */}
          {hasBalance && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0">
              Owes ₦{customer.totalBalance.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div
          className={`grid grid-cols-3 gap-3 p-3 rounded-xl mb-4 ${
            isDark ? "bg-gray-800/50" : "bg-gray-50"
          }`}
        >
          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`}
            >
              Orders
            </p>
            <p
              className={`text-sm font-bold mt-0.5 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {customer.totalOrders}
            </p>
          </div>
          <div className={`text-center border-x ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`} 
            >
              Spent
            </p>
            <p className="text-sm font-bold mt-0.5 text-primary-500">
              ₦{customer.totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-gray-600" : "text-gray-400"
              }`}
            >
              Paid
            </p>
            <p
              className={`text-sm font-bold mt-0.5 ${
                customer.totalBalance > 0
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              ₦{customer.totalPaid.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HiOutlineClock
              className={`w-3.5 h-3.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}
            />
            <p
              className={`text-[11px] ${isDark ? "text-gray-600" : "text-gray-400"}`}
            >
              Last order {timeAgo(customer.lastOrderDate)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNewOrder(customer);
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-500 hover:text-primary-600 transition-colors"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            New order
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton Card ─────────────────────────────────────────────
const SkeletonCard = ({ isDark }) => (
  <div
    className={`rounded-2xl border p-5 animate-pulse ${
      isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
    }`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-11 h-11 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
      />
      <div className="space-y-2">
        <div
          className={`h-3.5 w-28 rounded ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
        />
        <div
          className={`h-3 w-20 rounded ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
        />
      </div>
    </div>
    <div
      className={`h-16 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
    />
  </div>
);

// ── Empty State ───────────────────────────────────────────────
const EmptyState = ({ isDark, hasSearch, onClear }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20">
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
      {hasSearch ? "No customers match your search" : "No customers yet"}
    </p>
    <p
      className={`text-xs mt-1.5 text-center max-w-xs leading-relaxed ${
        isDark ? "text-gray-600" : "text-gray-400"
      }`}
    >
      {hasSearch
        ? "Try a different name or phone number"
        : "Customers appear here automatically when you create orders"}
    </p>
    {hasSearch && (
      <button
        onClick={onClear}
        className="btn-secondary text-xs px-4 py-2 mt-4"
      >
        Clear search
      </button>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────
const Customers = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  // Debounce search — don't hit API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", 12);
        if (debouncedSearch) params.append("search", debouncedSearch);

        const { data } = await API.get(`/customers?${params.toString()}`);
        setCustomers(data.data);
        setPagination(data.pagination);
      } catch {
        // Silent fail — don't crash the page
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch],
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleNewOrder = (customer) => {
    // Pre-fill customer info when creating new order
    navigate("/orders/create", {
      state: {
        prefill: {
          name: customer.name,
          phone: customer.phone || "",
          address: customer.address || "",
        },
      },
    });
  };

  const handleViewCustomer = (customer) => {
    if (!customer.phone) return;
    navigate(`/customers/${encodeURIComponent(customer.phone)}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Customers
          </h1>
          <p
            className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            {pagination.total > 0
              ? `${pagination.total} customer${pagination.total !== 1 ? "s" : ""} from your order history`
              : "All your customers in one place"}
          </p>
        </div>
        <button
          onClick={() => fetchCustomers(true)}
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
      </div>

      {/* Search */}
      <div
        className={`rounded-2xl border p-4 ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}
      >
        <div className="relative">
          <HiOutlineSearch
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone number..."
            className="input pl-10 pr-10 h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                isDark
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} isDark={isDark} />)
        ) : customers.length === 0 ? (
          <EmptyState
            isDark={isDark}
            hasSearch={!!search}
            onClear={() => setSearch("")}
          />
        ) : (
          customers.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              isDark={isDark}
              onClick={() => handleViewCustomer(customer)}
              onNewOrder={handleNewOrder}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div
          className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
          }`}
        >
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            customers
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`p-2 rounded-lg border transition-all disabled:opacity-40 ${
                isDark
                  ? "border-gray-800 hover:bg-gray-800 text-gray-400"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className={`p-2 rounded-lg border transition-all disabled:opacity-40 ${
                isDark
                  ? "border-gray-800 hover:bg-gray-800 text-gray-400"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
