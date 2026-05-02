import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import API from '../api/axios';
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const PaymentVerify = () => {
  const { isDark } = useTheme();
  const { refreshPlan } = usePlan();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    const verify = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const ref = reference || trxref;

      if (!ref) {
        setStatus('failed');
        setMessage('No payment reference found');
        return;
      }

      try {
        const { data } = await API.get(`/payment/verify?reference=${ref}`);

       if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setExpiresAt(data.data.subscriptionExpiresAt);
          // Small delay ensures DB write is complete before re-fetch
          setTimeout(() => {
            refreshPlan();
          }, 1000);
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed');
        }
      } catch (err) {
        setStatus('failed');
        setMessage(
          err.response?.data?.message || 'Could not verify payment'
        );
      }
    };

    verify();
  }, [searchParams, refreshPlan]);

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full mx-auto text-center px-6">

        {/* Verifying */}
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}>
              <div className="w-8 h-8 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Verifying your payment
              </h2>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Please wait while we confirm your payment with Paystack...
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="space-y-5 animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center mx-auto">
              <HiOutlineCheckCircle className="w-10 h-10 text-primary-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Welcome to Premium! 🎉
              </h2>
              <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {message}
              </p>
              {expiresAt && (
                <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  <span>✅</span>
                  Active until {new Date(expiresAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/')}
                className="btn-primary w-full h-12"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate('/orders/create')}
                className="btn-secondary w-full h-12"
              >
                Create your first unlimited order
              </button>
            </div>
          </div>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div className="space-y-5 animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto">
              <HiOutlineExclamationCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Payment not confirmed
              </h2>
              <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {message}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/upgrade')}
                className="btn-primary w-full h-12"
              >
                Try again
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary w-full h-12"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerify;