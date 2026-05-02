import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiSun, HiMoon, HiMenu } from 'react-icons/hi';
import { IoNotificationsOutline } from 'react-icons/io5';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className={`sticky top-0 z-40 w-full backdrop-blur-md ${
      isDark
        ? 'bg-gray-950/90 border-b border-gray-800/60'
        : 'bg-white/90 border-b border-gray-100'
    }`}>
      <div className="flex items-center justify-between px-4 md:px-8 h-16">

        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className={`md:hidden p-2 rounded-xl transition-all duration-200 active:scale-95 ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <HiMenu className="w-5 h-5" />
          </button>

          {/* Page Title Area */}
          <div>
            <h1 className={`text-sm font-semibold hidden md:block ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Good {getGreeting()},{' '}
              <span className="text-primary-500">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className={`text-xs hidden md:block ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {new Date().toLocaleDateString('en-NG', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`relative p-2.5 rounded-xl transition-all duration-300 active:scale-95 group ${
              isDark
                ? 'bg-gray-800/80 hover:bg-gray-700 text-yellow-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <div className="transition-transform duration-300 group-hover:rotate-12">
              {isDark ? <HiSun className="w-[18px] h-[18px]" /> : <HiMoon className="w-[18px] h-[18px]" />}
            </div>
          </button>

          {/* Notifications */}
          <button className={`relative p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isDark
              ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
          }`}>
            <IoNotificationsOutline className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
          </button>

          {/* Divider */}
          <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

          {/* Avatar */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
                {getInitials(user?.name)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-400 rounded-full ring-2 ring-white dark:ring-gray-950" />
            </div>
            <div className="hidden md:block">
              <p className={`text-sm font-semibold leading-none ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {user?.name}
              </p>
              <p className="text-xs text-primary-500 mt-0.5 font-medium">Online</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export default Navbar;