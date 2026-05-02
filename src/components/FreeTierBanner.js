import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineLightningBolt, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';

const FreeTierBanner = () => {
  const { plan } = usePlan();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if premium, loading, or dismissed
if (!plan || plan.isPremium || plan.plan === 'premium' || dismissed) return null;
  const { ordersRemaining, orderCount, orderLimit } = plan;
  const isAtLimit = ordersRemaining === 0;
  const isNearLimit = ordersRemaining <= 2 && ordersRemaining > 0;

  // Only show when vendor is near or at the limit
  if (!isAtLimit && !isNearLimit) return null;

  const progressPct = Math.min(100, (orderCount / orderLimit) * 100);

  return (
    <div className={`rounded-2xl border p-4 mb-6 ${
      isAtLimit
        ? isDark
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-red-50 border-red-200'
        : isDark
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAtLimit ? 'bg-red-500/20' : 'bg-amber-500/20'
        }`}>
          <HiOutlineLightningBolt className={`w-5 h-5 ${
            isAtLimit ? 'text-red-500' : 'text-amber-500'
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${
            isAtLimit
              ? isDark ? 'text-red-400' : 'text-red-700'
              : isDark ? 'text-amber-400' : 'text-amber-700'
          }`}>
            {isAtLimit
              ? 'Free plan limit reached'
              : `Only ${ordersRemaining} order${ordersRemaining !== 1 ? 's' : ''} remaining`
            }
          </p>
          <p className={`text-xs mt-0.5 ${
            isAtLimit
              ? isDark ? 'text-red-400/70' : 'text-red-600'
              : isDark ? 'text-amber-400/70' : 'text-amber-600'
          }`}>
            {isAtLimit
              ? 'Upgrade to Premium to create unlimited orders and unlock all features'
              : `You've used ${orderCount} of ${orderLimit} free orders. Upgrade to never hit a limit.`
            }
          </p>

          {/* Progress bar */}
          <div className={`h-1.5 rounded-full overflow-hidden mt-3 ${
            isDark ? 'bg-gray-800' : 'bg-white/60'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isAtLimit ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => navigate('/upgrade')}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 active:scale-95 ${
                isAtLimit
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              Upgrade to Premium — ₦5,000/mo
            </button>
            {!isAtLimit && (
              <button
                onClick={() => setDismissed(true)}
                className={`text-xs font-medium ${
                  isDark ? 'text-amber-400/60 hover:text-amber-400' : 'text-amber-600/60 hover:text-amber-700'
                }`}
              >
                Remind me later
              </button>
            )}
          </div>
        </div>

        {/* Dismiss */}
        {!isAtLimit && (
          <button
            onClick={() => setDismissed(true)}
            className={`p-1 rounded-lg flex-shrink-0 ${
              isDark ? 'text-amber-400/40 hover:text-amber-400' : 'text-amber-400 hover:text-amber-600'
            }`}
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FreeTierBanner;