import axios from "axios";

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
    if (error.response?.status === 401) {
      // Token expired or invalid -> Clear local storage and reload
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;