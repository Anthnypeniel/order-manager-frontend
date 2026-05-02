import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach access token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh when access token expires —
// vendor never gets logged out unexpectedly
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only retry once — prevents infinite loops
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Call refresh endpoint with raw axios —
          // not API instance to avoid interceptor loop
          const { data } = await axios.post(
            'http://localhost:5000/api/auth/refresh',
            { refreshToken }
          );

          // Save new access token
          localStorage.setItem('token', data.token);

          // Retry original request with new token
          original.headers.Authorization = `Bearer ${data.token}`;
          return API(original);
        } catch {
          // Refresh token also expired — full logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;