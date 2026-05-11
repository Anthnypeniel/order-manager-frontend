import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiSun, HiMoon } from 'react-icons/hi';
import { IoStorefrontOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { HiArrowRight } from 'react-icons/hi';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email if coming from verification page
  useEffect(() => {
    if (location.state?.verifiedEmail) {
      setForm(prev => ({ ...prev, email: location.state.verifiedEmail }));
      toast.success(location.state.message || 'Email verified! Please login.');
    }
  }, []);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
     login(
        { _id: data._id, name: data.name, email: data.email },
        data.token,
        data.refreshToken
      );
      toast.success(`Welcome back, ${data.name.split(' ')[0]}! `);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      // If unverified — redirect to verify page instead of showing error
      if (data?.requiresVerification) {
        toast.error('Please verify your email first');
        navigate('/verify-email', { state: { email: form.email } });
        return;
      }
      toast.error(data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #15803d 0%, #166534 40%, #14532d 100%)' }}>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute top-32 left-32 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border-2 border-white" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full border-2 border-white" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white" />
        </div>

        {/* Top Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <IoStorefrontOutline className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">OrderManager</span>
        </div>

        {/* Middle Content */}
        <div className="relative space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Active Vendors', value: '2,400+' },
              { label: 'Orders Today', value: '12,800' },
              { label: 'Revenue Tracked', value: '₦4.2B' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-white/60 text-xs font-medium">{stat.label}</p>
                <p className="text-white font-bold text-2xl mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h1 className="text-white font-bold text-4xl leading-tight">
              Manage your orders
              <br />
              <span className="text-primary-300">like a pro.</span>
            </h1>
            <p className="text-white/60 text-base mt-4 leading-relaxed max-w-sm">
              Track every order, monitor daily revenue, and grow your business — all from one beautiful dashboard.
            </p>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <p className="text-white/80 text-sm leading-relaxed italic">
              "Since I started using OrderManager, I never miss an order. My customers are happier and I make more money daily."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 rounded-xl bg-primary-400 flex items-center justify-center text-white font-bold text-sm">
                AC
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Adaeze Chukwu</p>
                <p className="text-white/50 text-xs">Food Vendor, Lagos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} OrderManager. Built for Nigerian vendors.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
              <IoStorefrontOutline className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              OrderManager
            </span>
          </div>
          <div className="lg:ml-auto flex items-center gap-3">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No account?
            </span>
            <Link to="/register"
              className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors">
              Sign up free →
            </Link>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-200 ml-2 ${
                isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isDark ? <HiSun className="w-4 h-4" /> : <HiMoon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Form Center */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{
                  backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                  color: '#22c55e'
                }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                Secure Login
              </div>
              <h2 className={`text-3xl font-bold leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Welcome back
              </h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Sign in to your vendor dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                
                    placeholder="you@example.com"
                    className="input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Password</label>
                  <button type="button"
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword
                      ? <IoEyeOffOutline className="w-4 h-4" />
                      : <IoEyeOutline className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 h-12 text-base"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign in
                    <HiArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className={`text-center text-xs mt-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              By signing in, you agree to our{' '}
              <span className="text-primary-500 cursor-pointer">Terms</span>
              {' '}and{' '}
              <span className="text-primary-500 cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;