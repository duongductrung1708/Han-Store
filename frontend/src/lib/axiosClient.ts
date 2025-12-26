import axios from "axios";

// Get base URL from environment variable
// In production, VITE_API_BASE_URL must be set to your Render backend URL
const baseURL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? "http://localhost:5000" : "");

if (!baseURL && import.meta.env.PROD) {
  console.error(
    "VITE_API_BASE_URL is not set! Please set it in your Vercel environment variables."
  );
}

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Chỉ retry khi có 401 và chưa retry, và không phải là request refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;
      try {
        // Thử refresh token
        await axiosClient.post("/api/auth/refresh-token");
        // Retry request gốc với token mới
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed - không retry nữa, reject error
        // eslint-disable-next-line no-console
        console.error("Refresh token failed", refreshError);
        // Không retry lại request gốc nữa để tránh vòng lặp
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);


