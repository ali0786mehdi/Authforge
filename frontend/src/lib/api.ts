import axios, { InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string> | null = null;

// Attach the short-lived access token and selected organization to API requests.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const orgId = localStorage.getItem('activeOrganizationId');
    if (orgId) {
      config.headers['X-Organization-Id'] = orgId;
    }
  }

  return config;
});

const isPublicAuthRequest = (url = '') =>
  /\/auth\/(login|mfa\/login|register|refresh|forgot-password|reset-password|verify-email|resend-verification)(\/|$|\?)/.test(url);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    // Never attempt refresh for login/MFA/registration or for the refresh call itself.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post('/auth/refresh')
          .then(({ data }) => {
            const accessToken = data?.data?.accessToken;
            if (typeof accessToken !== 'string' || accessToken.length === 0) {
              throw new Error('Refresh response did not include an access token');
            }
            return accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const accessToken = await refreshPromise;
      localStorage.setItem('accessToken', accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
      return Promise.reject(refreshError);
    }
  }
);
