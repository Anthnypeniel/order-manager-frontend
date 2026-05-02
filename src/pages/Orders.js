import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';

// ── Status config — single source of truth ────────────────────
const STATUS_CONFIG = {
  all:        { label: 'All',        color: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-600 dark:text-gray-400' },
  pending:    { label: 'Pending',    color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400' },
  confirmed:  { label: 'Confirmed',  color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600 dark:text-blue-400' },
  processing: { label: 'Processing', color: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  completed:  { label: 'Completed',  color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-500/10',text: 'text-emerald-600 dark:text-emerald-400' },
  cancelled:  { label: 'Cancelled',  color: '#ef4444', bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-500 dark:text-red-400' },
};

const PAYMENT_CONFIG = {
  all:     { label: 'All Payment' },
  paid:    { label: 'Paid',    color: '#22c55e' },
  unpaid:  { label: 'Unpaid',  color: '#ef4444' },
  partial: { label: 'Partial', color: '#f59e0b' },
};

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
};

// ── Payment Badge ─────────────────────────────────────────────
const PaymentBadge = ({ status }) => {
  const map = {
    paid:    'text-emerald-600 dark:text-emerald-400',
    unpaid:  'text-red-500 dark:text-red-400',
    partial: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <span className={`text-[11px] font-semibold capitalize ${map[status] || 'text-gray-400'}`}>
      {status}
    </span>
  );
};

// ── Skeleton Row — prevents layout shift during load ──────────
const SkeletonRow = ({ isDark }) => (
  <div className={`flex items-center gap-4 px-5 py-4 animate-pulse`}>
    <div className={`w-9 h-9 rounded-xl flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
    <div className="flex-1 space-y-2">
      <div className={`h-3 rounded w-32 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
      <div className={`h-2.5 rounded w-20 ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`} />
    </div>
    <div className={`h-6 w-20 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
    <div className={`h-3 w-16 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
    <div className={`h-3 w-4 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
  </div>
);

// ── Empty State ───────────────────────────────────────────────
const EmptyState = ({ isDark, hasFilters, onClear, onCreate }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
      isDark ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <HiOutlineShoppingBag className={`w-7 h-7 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
    </div>
    <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      {hasFilters ? 'No orders match your filters' : 'No orders yet'}
    </p>
    <p className={`text-xs mt-1.5 max-w-xs leading-relaxed ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
      {hasFilters
        ? 'Try adjusting your search or filter criteria'
        : 'Create your first order to start tracking your business revenue'}
    </p>
    <div className="flex items-center gap-2 mt-5">
      {hasFilters && (
        <button onClick={onClear} className="btn-secondary text-xs px-4 py-2">
          Clear filters
        </button>
      )}
      {!hasFilters && (
        <button onClick={onCreate} className="btn-primary text-xs px-4 py-2">
          <HiOutlinePlus className="w-3.5 h-3.5" />
          Create first order
        </button>
      )}
    </div>
  </div>
);

// ── Main Orders Page ──────────────────────────────────────────
const Orders = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = useRef(null);

  // Debounce search — avoid hammering the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);

      const { data } = await API.get(`/orders?${params.toString()}`);
      setOrders(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Could not load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, statusFilter, paymentFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, paymentFilter]);

  const hasFilters = search || statusFilter !== 'all' || paymentFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setPage(1);
    searchRef.current?.focus();
  };

  // Format date in a human-readable way
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Orders
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {pagination.total > 0
              ? `${pagination.total} order${pagination.total !== 1 ? 's' : ''} total`
              : 'Manage and track all your orders'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${
              isDark
                ? 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500'
            }`}
          >
            <HiOutlineRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/orders/create')}
            className="btn-primary text-sm px-4 py-2.5 h-10"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className={`rounded-2xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
      }`}>
        <div className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <HiOutlineSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by customer name, phone, or order number..."
                className="input pl-10 pr-10 h-10 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors ${
                    isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                showFilters || hasFilters
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <HiOutlineFilter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className={`w-1.5 h-1.5 rounded-full ${showFilters ? 'bg-white' : 'bg-primary-500'}`} />
              )}
            </button>
          </div>

          {/* Filter Panel — slides open */}
          {showFilters && (
            <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {/* Status Filters */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Order Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                        statusFilter === key
                          ? 'text-white border-transparent'
                          : isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                      style={statusFilter === key ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Filters */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Payment Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PAYMENT_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setPaymentFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                        paymentFilter === key
                          ? 'border-transparent text-white'
                          : isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                      style={paymentFilter === key && cfg.color
                        ? { backgroundColor: cfg.color, borderColor: cfg.color }
                        : paymentFilter === key
                          ? { backgroundColor: '#6b7280', borderColor: '#6b7280' }
                          : {}
                      }
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className={`text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors`}
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Orders Table ── */}
        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>

          {/* Table Header */}
          <div className={`grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest ${
            isDark ? 'text-gray-600 bg-gray-900/50' : 'text-gray-400 bg-gray-50/80'
          }`}>
            <div className="col-span-5">Customer</div>
            <div className="col-span-2 hidden md:block">Order</div>
            <div className="col-span-2 hidden sm:block">Status</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} isDark={isDark} />)}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              isDark={isDark}
              hasFilters={!!hasFilters}
              onClear={clearFilters}
              onCreate={() => navigate('/orders/create')}
            />
          ) : (
            <div>
              {orders.map((order, i) => (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  className={`grid grid-cols-12 gap-4 items-center px-5 py-4 cursor-pointer transition-all duration-150 group border-b last:border-b-0 ${
                    isDark
                      ? 'border-gray-800/60 hover:bg-gray-800/40'
                      : 'border-gray-50 hover:bg-gray-50/80'
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Customer */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        background: `hsl(${(order.customer?.name?.charCodeAt(0) || 65) * 5}, 55%, 42%)`
                      }}
                    >
                      {order.customer?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {order.customer?.name}
                      </p>
                      <p className={`text-[11px] truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {order.customer?.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="col-span-2 hidden md:block">
                    <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {order.orderNumber}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden sm:flex flex-col gap-1">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.paymentStatus} />
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₦{order.totalAmount?.toLocaleString()}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 flex justify-end">
                    <HiOutlineArrowRight className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div className={`flex items-center justify-between px-5 py-4 border-t ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Page {pagination.page} of {pagination.pages} &middot; {pagination.total} orders
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-lg border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'border-gray-800 hover:bg-gray-800 text-gray-400'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                      page === pageNum
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : isDark
                          ? 'border-gray-800 hover:bg-gray-800 text-gray-400'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className={`p-2 rounded-lg border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'border-gray-800 hover:bg-gray-800 text-gray-400'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;