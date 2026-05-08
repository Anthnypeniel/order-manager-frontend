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

const NOTIFICATION_TYPES = {
  unpaid_orders:          { icon: HiOutlineCurrencyDollar, color: '#f59e0b', action: '/orders?paymentStatus=unpaid' },
  pending_orders:         { icon: HiOutlineClock,          color: '#3b82f6', action: '/orders?status=pending' },
  free_limit:             { icon: HiOutlineLightningBolt,  color: '#ef4444', action: '/upgrade' },
  subscription_expiring:  { icon: HiOutlineLightningBolt,  color: '#f59e0b', action: '/upgrade' },
  daily_revenue:          { icon: HiOutlineTrendingUp,     color: '#22c55e', action: '/' },
  new_orders:             { icon: HiOutlineShoppingBag,    color: '#8b5cf6', action: '/orders' },
};

const NotificationCenter = () => {
  const { isDark } = useTheme();
  const { plan } = usePlan();
  const navigate = useNavigate();
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

  const buildNotifications = async () => {
    setLoading(true);
    try {
      const notes = [];

      const [unpaidRes, pendingRes, todayRes] = await Promise.all([
        API.get('/orders?paymentStatus=unpaid&limit=50'),
        API.get('/orders?status=pending&limit=50'),
        API.get('/orders/today'),
      ]);

      const unpaidOrders = unpaidRes.data.data || [];
      const pendingOrders = pendingRes.data.data || [];
      const todayData = todayRes.data;

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

      if (todayData?.stats?.totalRevenue > 0) {
        notes.push({
          id: 'revenue',
          type: 'daily_revenue',
          title: `₦${todayData.stats.totalRevenue.toLocaleString()} revenue today`,
          message: `${todayData.totalOrders} order${todayData.totalOrders !== 1 ? 's' : ''} · ₦${todayData.stats.totalCollected.toLocaleString()} collected`,
          time: 'Today',
          read: true,
        });
      }

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
    } catch (err) {
      console.error('Notification error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) buildNotifications();
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    const config = NOTIFICATION_TYPES[notification.type];
    if (config?.action) navigate(config.action);
    setIsOpen(false);
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
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full text-white text-[9px] font-bold flex items-center ju