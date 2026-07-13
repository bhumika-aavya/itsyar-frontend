import axios from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "./getApiErrorMessage";

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL,
});

// Unauthenticated endpoints — a 401 here (e.g. an expired/invalid reset
// token) is an expected, form-level error, not a "your session died" signal,
// so it must not wipe localStorage or redirect away from the page that's
// trying to show the user what went wrong.
const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

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
    const url: string = error.config?.url ?? "";
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
    // Only auto-toast on writes (forms/actions) and auth failures — silent GET
    // failures are used intentionally by several services to fall back to mock data.
    const method = error.config?.method?.toLowerCase();
    if (isUnauthorized || (method && method !== "get")) {
      toast.error(getApiErrorMessage(error));
    }

    if (isUnauthorized && !isPublicAuthRequest) {
      // Token expired or invalid -> Clear local storage and reload
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;