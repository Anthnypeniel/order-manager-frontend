import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineClock,
} from 'react-icons/hi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { RiShieldCheckLine } from 'react-icons/ri';

// ── Feature list — ordered by vendor perceived value ─────────
const FEATURES = [
  {
    icon: HiOutlineShoppingBag,
    title: 'Unlimited Orders',
    desc: 'No caps. Create as many orders as your business demands.',
    color: '#22c55e',
  },
  {
    icon: IoLogoWhatsapp,
    title: 'WhatsApp Order Sharing',
    desc: 'Send professional order summaries to customers in one tap.',
    color: '#25D366',
  },
  {
    icon: HiOutlineChartBar,
    title: '7-Day Revenue Chart',
    desc: 'See your business trends. Know your best performing days.',
    color: '#3b82f6',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Sales by Source',
    desc: 'Know if Instagram or WhatsApp drives more revenue.',
    color: '#8b5cf6',
  },
  {
    icon: HiOutlineSparkles,
    title: 'Multi-Platform Tracking',
    desc: 'Track orders from every channel in one place.',
    color: '#f59e0b',
  },
  {
    icon: RiShieldCheckLine,
    title: 'Priority Support',
    desc: 'Get help faster when your business needs it most.',
    color: '#ef4444',
  },
];

// ── Billing toggle ────────────────────────────────────────────
const BillingToggle = ({ cycle, onChange, isDark }) => (
  <div className={`inline-flex rounded-2xl p-1 border ${
    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
  }`}>
    {['monthly', 'annual'].map(option => (
      <button
        key={option}
        onClick={() => onChange(option)}
        className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
          cycle === option
            ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white'
            : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {option}
        {/* Annual savings badge */}
        {option === 'annual' && (
          <span className="absolute -top-2.5 -right-2 bg-primary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            SAVE ₦3K
          </span>
        )}
      </button>
    ))}
  </div>
);

// ── Price display ─────────────────────────────────────────────
const PriceDisplay = ({ cycle, isDark }) => {
  const isAnnual = cycle === 'annual';

  return (
    <div className="text-center py-4">
      {isAnnual && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`text-sm line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            ₦60,000/yr
          </span>
          <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full">
            Save ₦3,000
          </span>
        </div>
      )}

      <div className="flex items-baseline justify-center gap-1">
        <span className={`text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          ₦{isAnnual ? '57,000' : '5,000'}
        </span>
        <span className={`text-sm ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          /{isAnnual ? 'year' : 'month'}
        </span>
      </div>

      {isAnnual ? (
        <p className="text-xs text-primary-500 font-semibold mt-1.5">
          ₦4,750/month · billed annually
        </p>
      ) : (
        <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          billed monthly · cancel anytime
        </p>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const Upgrade = () => {
  const { isDark } = useTheme();
  const { plan } = usePlan();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('annual');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/payment/initialize', { billingCycle });
      window.location.href = data.data.authorizationUrl;
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not initialize payment'
      );
      setLoading(false);
    }
  };

  // Already premium
  if (plan?.isPremium) {
    const isAnnual = plan.subscriptionExpiresAt &&
      new Date(plan.subscriptionExpiresAt) - new Date() > 31 * 24 * 60 * 60 * 1000;

    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5">
          <HiOutlineCheckCircle className="w-10 h-10 text-primary-500" />
        </div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          You're on Premium 🎉
        </h1>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {isAnnual ? 'Annual' : 'Monthly'} plan · Active until{' '}
          {new Date(plan.subscriptionExpiresAt).toLocaleDateString('en-NG', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
        <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm ${
          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
        }`}>
          <HiOutlineClock className="w-4 h-4" />
          {Math.ceil(
            (new Date(plan.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
          )} days remaining
        </div>
        <button
          onClick={() => navigate('/')}
          className="btn-primary mt-6 px-8"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => navigate(-1)}
          className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-95 flex-shrink-0 ${
            isDark
              ? 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500'
          }`}
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Upgrade to Premium
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Everything your business needs to grow
          </p>
        </div>
      </div>

      {/* ── Billing Toggle — centered, prominent ── */}
      <div className="flex flex-col items-center mb-8">
        <BillingToggle
          cycle={billingCycle}
          onChange={setBillingCycle}
          isDark={isDark}
        />
        {billingCycle === 'annual' && (
          <p className={`text-xs mt-3 font-medium ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
             You save ₦3,000 by paying annually
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Features (3 cols) ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Current usage */}
          {plan && (
            <div className={`rounded-2xl border p-5 ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Your Free Plan Usage
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Orders created
                </span>
                <span className={`text-sm font-bold ${
                  plan.orderCount >= plan.orderLimit
                    ? 'text-red-500'
                    : isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {plan.orderCount} / {plan.orderLimit}
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    plan.orderCount >= plan.orderLimit
                      ? 'bg-red-500'
                      : 'bg-primary-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (plan.orderCount / plan.orderLimit) * 100)}%`
                  }}
                />
              </div>
              {plan.orderCount >= plan.orderLimit && (
                <p className="text-xs text-red-500 font-medium mt-2">
                   You've hit the free limit. Upgrade to keep creating orders.
                </p>
              )}
            </div>
          )}

          {/* Features */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}>
            <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Everything included in Premium
              </p>
            </div>
            <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-50'}`}>
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 px-5 py-4"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${
                      isDark ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {feature.title}
                    </p>
                    <p className={`text-xs mt-0.5 leading-relaxed ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {feature.desc}
                    </p>
                  </div>
                  <HiOutlineCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className={`rounded-2xl border p-5 ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}>
            <p className={`text-sm italic leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              "OrderManager paid for itself in the first week. I used to spend 2 hours daily tracking orders on WhatsApp. Now it takes 10 minutes."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                NK
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Ngozi Kalu
                </p>
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Fashion vendor · Lagos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Pricing Card (2 cols) ── */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl border sticky top-24 overflow-hidden ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}>
            {/* Top gradient accent */}
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #22c55e, #15803d)' }}
            />

            <div className="p-6">
              {/* Plan label */}
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    color: '#22c55e'
                  }}>
                  <HiOutlineLightningBolt className="w-3.5 h-3.5" />
                  Premium {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                </div>
                {billingCycle === 'annual' && (
                  <span className="text-[10px] font-bold bg-primary-500 text-white px-2 py-1 rounded-full">
                    BEST VALUE
                  </span>
                )}
              </div>

              {/* Price */}
              <PriceDisplay cycle={billingCycle} isDark={isDark} />

              {/* Annual savings callout */}
              {billingCycle === 'annual' && (
                <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${
                  isDark ? 'bg-primary-500/10' : 'bg-primary-50'
                }`}>
                  <span className="text-lg">🎁</span>
                  <div>
                    <p className="text-xs font-bold text-primary-500">
                      You save ₦3,000
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      vs paying monthly for 12 months
                    </p>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className={`border-t my-4 ${isDark ? 'border-gray-800' : 'border-gray-100'}`} />

              {/* Quick feature list */}
              <div className="space-y-2 mb-5">
                {[
                  'Unlimited order creation',
                  'Full revenue dashboard',
                  'WhatsApp order sharing',
                  'Sales source analytics',
                  billingCycle === 'annual' ? '365 days of access' : '30 days of access',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <HiOutlineCheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className={`text-xs font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Vendor preview */}
              <div className={`p-3 rounded-xl mb-5 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Upgrading as
                </p>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name}
                </p>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {user?.email}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="btn-primary w-full h-12 text-sm mb-3"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting to Paystack...
                  </>
                ) : (
                  <>
                    <HiOutlineLockClosed className="w-4 h-4" />
                    Pay ₦{billingCycle === 'annual' ? '57,000' : '5,000'} securely
                  </>
                )}
              </button>

              {/* Switch billing cycle */}
              <button
                onClick={() => setBillingCycle(
                  billingCycle === 'annual' ? 'monthly' : 'annual'
                )}
                className={`w-full text-xs font-medium py-2 transition-colors ${
                  isDark
                    ? 'text-gray-600 hover:text-gray-400'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {billingCycle === 'annual'
                  ? 'Switch to monthly (₦5,000/mo)'
                  : 'Switch to annual and save ₦3,000'
                }
              </button>

              {/* Trust signals */}
              <div className={`border-t mt-4 pt-4 flex items-center justify-center gap-3 flex-wrap ${
                isDark ? 'border-gray-800' : 'border-gray-100'
              }`}>
                <span className={`text-[10px] flex items-center gap-1 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  🔒 Secured by Paystack
                </span>
                <span className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>•</span>
                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  🇳🇬 Built for Nigeria
                </span>
                <span className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>•</span>
                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;