import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import API from '../api/axios';
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
} from 'react-icons/io5';
import {
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineShoppingBag,
  HiOutlineTrendingUp,
  HiOutlineX,
} from 'react-icons/hi';

// ── Notification types — each has an icon, color and action ──
const NOTIFICATION_TYPES = {
  unpaid_orders: {
    icon: HiOutlineCurrencyDollar,
    color: '#f59e0b',
    action: '/orders?paymentStatus=unpaid',
  },
  pending_orders: {
    icon: HiOutlineClock,
    color: '#3b82f6',
    action: '/orders?status=pending',
  },
  free_limit: {
    icon: HiOutlineLightningBolt,
    color: '#ef4444',
    action: '/upgrade',
  },
  subscription_expiring: {
    icon: HiOutlineLightningBolt,
    color: '#f59e0b',
    action: '/upgrade',
  },
  daily_revenue: {
    icon: HiOutlineTrendingUp,
    color: '#22c55e',
    action: '/',
  },
  new_orders: {
    icon: HiOutlineShoppingBag,
    color: '#8b5cf6',
    action: '/orders',
  },
};

// ── Single notification item ──────────────────────────────────
const NotificationItem = ({ notification, onRead, isDark }) => {
  const navigate = useNavigate();
  const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.new_orders;
  const Icon = config.icon;

  const handleClick = () => {
    onRead(notification.id);
    navigate(config.action);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 ${
        !notification.read
          ? isDark ? 'bg-gray-800/60' : 'bg-primary-50/60'
          : ''
      } ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug ${
          isDark ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {notification.title}
        </p>
        <p className={`text-xs mt-0.5 leading-relaxed ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {notification.message}
        </p>
        <p className={`text-[10px] mt-1 ${
          isDark ? 'text-gray-600' : 'text-gray-300'
        }`}>
          {notification.time}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
};

// ── Main Notification Center ──────────────────────────────────
const NotificationCenter = () => {
  const { isDark } = useTheme();
  const { plan } = usePlan();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build smart notifications from real data
  const buildNotifications = async () => {
    setLoading(true);
    try {
      const notes = [];

      // Fetch orders data
      const [unpaidRes, pendingRes, todayRes] = await Promise.all([
        API.get('/orders?paymentStatus=unpaid&limit=50'),
        API.get('/orders?status=pending&limit=50'),
        API.get('/orders/today'),
      ]);

      const unpaidOrders = unpaidRes.data.data || [];
      const pendingOrders = pendingRes.data.data || [];
      const todayData = todayRes.data;

      // Unpaid orders notification
      if (unpaidOrders.length > 0) {
        const totalUnpaid = unpaidOrders.reduce(
          (sum, o) => sum + (o.balance || 0), 0
        );
        notes.push({
          id: 'unpaid',
          type: 'unpaid_orders',
          title: `${unpaidOrders.length} unpaid order${unpaidOrders.length !== 1 ? 's' : ''}`,
          message: `₦${totalUnpaid.toLocaleString()} yet to be collected`,
          time: 'Tap to view',
          read: false,
        });
      }

      // Pending orders notification
      if (pendingOrders.length > 0) {
        notes.push({
          id: 'pending',
          type: 'pending_orders',
          title: `${pendingOrders.length} order${pendingOrders.length !== 1 ? 's' : ''} awaiting confirmation`,
          message: 'These orders need your attention',
          time: 'Tap to view',
          read: false,
        });
      }

      // Free plan limit warning
      if (plan && !plan.isPremium) {
        if (plan.ordersRemaining <= 2) {
          notes.push({
            id: 'free_limit',
            type: 'free_limit',
            title: plan.ordersRemaining === 0
              ? 'Free plan limit reached'
              : `Only ${plan.ordersRemaining} free order${plan.ordersRemaining !== 1 ? 's' : ''} left`,
            message: 'Upgrade to Premium for unlimited orders',
            time: 'Tap to upgrade',
            read: false,
          });
        }
      }

      // Subscription expiring soon
      if (plan?.isPremium && plan?.subscriptionExpiresAt) {
        const daysLeft = Math.ceil(
          (new Date(plan.subscriptionExpiresAt) - new Date()) /
          (1000 * 60 * 60 * 24)
        );
        if (daysLeft <= 7) {
          notes.push({
            id: 'expiring',
            type: 'subscription_expiring',
            title: `Subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            message: 'Renew now to keep your business running smoothly',
            time: 'Tap to renew',
            read: false,
          });
        }
      }

      // Today's revenue summary
      if (todayData?.stats?.totalRevenue > 0) {
        notes.push({
          id: 'revenue',
          type: 'daily_revenue',
          title: `₦${todayData.stats.totalRevenue.toLocaleString()} revenue today`,
          message: `${todayData.totalOrders} order${todayData.totalOrders !== 1 ? 's' : ''} · ₦${todayData.stats.totalCollected.toLocaleString()} collected`,
          time: 'Today',
          read: true, // info only — not urgent
        });
      }

      // No notifications
      if (notes.length === 0) {
        notes.push({
          id: 'empty',
          type: 'new_orders',
          title: 'All caught up!',
          message: 'No pending actions. Your business is running smoothly.',
          time: 'Just now',
          read: true,
        });
      }

      setNotifications(notes);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      buildNotifications();
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={`relative p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
          isDark
            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
        }`}
      >
        <IoNotificationsOutline className="w-[18px] h-[18px]" />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 top-12 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-slide-up ${
            isDark
              ? 'bg-gray-900 border-gray-800 shadow-black/40'
              : 'bg-white border-gray-100 shadow-gray-200/60'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3.5 border-b ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <IoCheckmarkDoneOutline className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-600' : 'hover:bg-gray-100 text-gray-400'
                }`}
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-gray-800/60' : 'divide-gray-50'}`}>
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-4 py-3 border-t ${
            isDark ? 'border-gray-800' : 'border-gray-100'
          }`}>
            <p className={`text-[10px] text-center ${
              isDark ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Notifications refresh each time you open this panel
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;