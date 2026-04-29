import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { DASHBOARD_ROUTE, FORGOT_PASSWORD_ROUTE, LOGIN_ROUTE } from "../utils/appPaths";
import { storeAdminSession } from "../utils/auth";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  useEffect(() => {
    if (!email || !otp) {
      navigate(FORGOT_PASSWORD_ROUTE, { replace: true });
    }
  }, [email, otp, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/admin/forgot-password/reset", {
        email,
        otp,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });

      const loginResponse = await api.post("/admin/login", {
        email,
        password: form.newPassword
      });

      const token = loginResponse?.data?.token;

      if (!token) {
        setError("Password changed, but auto login failed.");
        navigate(LOGIN_ROUTE, { replace: true });
        return;
      }

      storeAdminSession(token, loginResponse?.data?.admin);
      navigate(DASHBOARD_ROUTE, { replace: true });
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-100 to-violet-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-xl backdrop-blur dark:bg-slate-900/85"
      >
        <Link to={FORGOT_PASSWORD_ROUTE} className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-500">
          <ArrowLeft size={16} /> Back
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">Set New Password</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Create your new admin password for <span className="font-medium">{email || "your account"}</span>.
        </p>

        <label className="relative mt-6 block">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            placeholder="New password"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-900"
          />
        </label>

        <label className="relative mt-3 block">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            placeholder="Confirm password"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-900"
          />
        </label>

        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
