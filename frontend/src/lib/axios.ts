import axios from "axios";

const baseURL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL ?? "");

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const { data } = await axios.post(baseURL + "/api/auth/refresh", {}, { withCredentials: true });
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(err.config);
        }
      } catch {
        // ignore
      }
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    let message = err.response?.data?.message ?? err.message ?? "Request failed";
    const isProxyOrNetworkError =
      !err.response ||
      err.code === "ECONNREFUSED" ||
      err.message === "Network Error" ||
      (err.response?.status === 500 && !err.response?.data?.message);
    if (isProxyOrNetworkError) {
      message = "Backend not reachable. Start it in another terminal: cd backend && npm run dev";
    }
    return Promise.reject(new Error(message));
  }
);
