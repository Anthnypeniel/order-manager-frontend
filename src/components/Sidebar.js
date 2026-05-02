import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineLightningBolt,
  HiX,
} from 'react-icons/hi';
import { IoStorefrontOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const navItems = [
  {
    path: '/',
    icon: HiOutlineHome,
    label: 'Dashboard',
    description: 'Overview & stats'
  },
  {
    path: '/orders',
    icon: HiOutlineClipboardList,
    label: 'Orders',
    description: 'Manage all orders'
  },
  {
    path: '/orders/create',
    icon: HiOutlinePlusCircle,
    label: 'New Order',
    description: 'Create order'
  },
];

// ── Upgrade Banner — shown in sidebar for free users ─────────
// Keeps the upgrade prompt visible without being aggressive.
// Disappears automatically when vendor upgrades.
const UpgradeBanner = () => {
  const { plan } = usePlan();
  const navigate = useNavigate();
  const { isDark } = useTheme();

if (!plan || plan.isPremium || plan.plan === 'premium') return null;

  return (
    <div
      onClick={() => navigate('/upgrade')}
      className={`mx-1 mb-2 p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 border ${
        isDark
          ? 'bg-primary-500/10 border-primary-500/20 hover:bg-primary-500/15'
          : 'bg-primary-50 border-primary-100 hover:bg-primary-100/80'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <HiOutlineLightningBolt className="w-3.5 h-3.5 text-primary-500" />
        <span className="text-xs font-bold text-primary-500">
          Upgrade to Premium
        </span>
      </div>
      <p className={`text-[10px] leading-relaxed ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {plan.ordersRemaining > 0
          ? `${plan.ordersRemaining} free order${plan.ordersRemaining !== 1 ? 's' : ''} left`
          : 'Free limit reached'
        } · ₦5,000/mo
      </p>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('See you soon! 👋');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDark ? 'bg-gray-950 border-r border-gray-800/60' : 'bg-white border-r border-gray-100'}`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between px-5 py-5 ${
          isDark ? 'border-b border-gray-800/60' : 'border-b border-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
              <IoStorefrontOutline className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`font-bold text-[15px] leading-none ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                OrderManager
              </p>
              <p className={`text-[11px] mt-0.5 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Business Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className={`text-[10px] font-bold uppercase tracking-widest px-3 mb-3 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Navigation
          </p>

          {navItems.map(({ path, icon: Icon, label, description }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
            >
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'text-white shadow-lg shadow-primary-500/20'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-100'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)'
                } : {}}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20'
                      : isDark
                        ? 'bg-gray-800 group-hover:bg-gray-700'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-none ${
                      isActive ? 'text-white' : ''
                    }`}>
                      {label}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${
                      isActive ? 'text-white/70' : isDark ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {description}
                    </p>
                  </div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`px-3 py-4 space-y-2 ${
          isDark ? 'border-t border-gray-800/60' : 'border-t border-gray-100'
        }`}>
          {/* User Card */}
          <div className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
            isDark ? 'bg-gray-800/60' : 'bg-gray-50'
          }`}>
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                {getInitials(user?.name)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-400 rounded-full ring-2 ring-white dark:ring-gray-900" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className={`text-sm font-semibold truncate leading-none ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {user?.name}
              </p>
              <p className={`text-[11px] truncate mt-0.5 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {user?.email}
              </p>
            </div>
          </div>

          

          {/* Logout */}
          <UpgradeBanner />
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
              isDark
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-red-500 hover:bg-red-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-red-500/10' : 'bg-red-50'
            }`}>
              <HiOutlineLogout className="w-4 h-4" />
            </div>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;