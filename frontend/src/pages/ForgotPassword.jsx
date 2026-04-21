import { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LOGIN_ROUTE, RESET_PASSWORD_ROUTE } from "../utils/appPaths";

function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendOtp = async () => {
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSendingOtp(true);
      setError("");
      setSuccess("");

      const response = await api.post("/admin/forgot-password/send-otp", {
        email: form.email.trim()
      });

      setOtpSent(true);
      setSuccess(response?.data?.message || "OTP sent successfully.");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.otp.trim()) {
      setError("Email and OTP are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post("/admin/forgot-password/verify-otp", {
        email: form.email.trim(),
        otp: form.otp.trim()
      });

      navigate(RESET_PASSWORD_ROUTE, {
        state: {
          email: form.email.trim(),
          otp: form.otp.trim()
        },
        replace: true
      });

      if (response?.data?.message) {
        setSuccess(response.data.message);
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-100 to-violet-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={verifyOtp}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/85"
      >
        <Link to={LOGIN_ROUTE} className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-indigo-500">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your admin email, send OTP, then verify it to continue.
        </p>

        <label className="relative mt-6 block">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Admin email"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <button
          type="button"
          onClick={sendOtp}
          disabled={sendingOtp}
          className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
        >
          {sendingOtp ? "Sending OTP..." : "Send OTP"}
        </button>

        <label className="relative mt-4 block">
          <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={form.otp}
            onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value }))}
            placeholder="Enter OTP"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        {otpSent ? <p className="mt-3 text-xs text-emerald-500">OTP sent to your email.</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-500">{success}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
