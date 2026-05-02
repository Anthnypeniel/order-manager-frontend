import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

const PlanContext = createContext();

export const PlanProvider = ({ children }) => {
  const { token } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    // Don't fetch if no token — user is not logged in
    if (!token) {
      setPlan(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await API.get('/payment/status');
      if (data.success) {
        setPlan(data.data);
      }
    } catch (err) {
      console.error('Plan fetch failed:', err.message);
      // Set a safe default so the UI doesn't break
      setPlan({
        plan: 'free',
        isPremium: false,
        orderCount: 0,
        orderLimit: 5,
        ordersRemaining: 5,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const refreshPlan = useCallback(() => fetchPlan(), [fetchPlan]);

  return (
    <PlanContext.Provider value={{ plan, loading, refreshPlan }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);