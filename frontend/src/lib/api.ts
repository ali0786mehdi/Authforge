import axios from 'axios';

// Create an Axios instance configured to talk to the Backend
export const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // IMPORTANT: Allows sending and receiving HttpOnly cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the access token and org id
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const orgId = localStorage.getItem('activeOrganizationId');
    if (orgId && config.headers) {
      config.headers['X-Organization-Id'] = orgId;
    }
  }
  return config;
});

// Intercept 401 Unauthorized errors to attempt silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the HttpOnly cookie
        const { data } = await axios.post('http://localhost:5000/auth/refresh', {}, {
          withCredentials: true 
        });

        const newAccessToken = data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, user is completely logged out
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

