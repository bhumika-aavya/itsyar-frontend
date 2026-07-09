import axios from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "./getApiErrorMessage";

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401;
    // Only auto-toast on writes (forms/actions) and auth failures — silent GET
    // failures are used intentionally by several services to fall back to mock data.
    const method = error.config?.method?.toLowerCase();
    if (isUnauthorized || (method && method !== "get")) {
      toast.error(getApiErrorMessage(error));
    }

    if (isUnauthorized) {
      // Token expired or invalid -> Clear local storage and reload
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;