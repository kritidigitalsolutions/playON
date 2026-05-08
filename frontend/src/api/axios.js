import axios from "axios";
import { clearAdminSession, getValidAdminToken } from "../utils/auth";
import {
  FORGOT_PASSWORD_ROUTE,
  LOGIN_ROUTE,
  RESET_PASSWORD_ROUTE,
  toAppPath
} from "../utils/appPaths";

const loginPath = toAppPath(LOGIN_ROUTE);
const forgotPasswordPath = toAppPath(FORGOT_PASSWORD_ROUTE);
const resetPasswordPath = toAppPath(RESET_PASSWORD_ROUTE);
const publicPaths = [loginPath, forgotPasswordPath, resetPasswordPath];

const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // In production (Vercel), use the deployed backend URL
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://play-on-weld.vercel.app/api";
  }
  return "http://localhost:8000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    const token = getValidAdminToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!publicPaths.includes(window.location.pathname)) {
      window.location.href = loginPath;
      return Promise.reject(new Error("Token expired"));
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAdminSession();
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
