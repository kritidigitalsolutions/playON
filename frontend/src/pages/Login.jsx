import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { DASHBOARD_ROUTE, FORGOT_PASSWORD_ROUTE } from "../utils/appPaths";
import { storeAdminSession } from "../utils/auth";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/admin/login", {
        email: form.email,
        password: form.password
      });

      const token = response?.data?.token;

      if (!token) {
        setError("Login failed: token not received.");
        return;
      }

      storeAdminSession(token, response?.data?.admin);

      const redirectPath = location.state?.from?.pathname || DASHBOARD_ROUTE;
      navigate(redirectPath, { replace: true });
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-100 to-violet-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/85"
      >
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">PlayON Admin Login</h1>

        <label className="relative mt-6 block">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email address"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="relative mt-3 block">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Password"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>

        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}

        <div className="mt-3 flex justify-end">
          <Link to={FORGOT_PASSWORD_ROUTE} className="text-sm font-medium text-indigo-500 transition hover:text-indigo-600">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default Login;
