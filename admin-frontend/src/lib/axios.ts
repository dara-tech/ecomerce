import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken || original.url?.includes('/auth/refresh')) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) reject(error);
          else {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          }
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/refresh', { refreshToken });
      localStorage.setItem('token', data.accessToken || data.token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.sessionId) localStorage.setItem('sessionId', data.sessionId);
      processQueue(data.accessToken || data.token);
      original.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
