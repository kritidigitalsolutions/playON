import { useMemo, useState } from "react";
import { KeyRound, Mail, Send } from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import { getAdminProfile, getValidAdminToken, PROFILE_KEY } from "../utils/auth";

const defaultEmailForm = (currentEmail = "") => ({
  oldEmail: currentEmail,
  newEmail: "",
  otp: ""
});

const defaultPasswordForm = {
  oldPassword: "",
  otp: "",
  newPassword: "",
  confirmPassword: ""
};

function Settings() {
  const adminProfile = useMemo(() => getAdminProfile(), []);
  const currentEmail = adminProfile?.email || "";

  const [emailForm, setEmailForm] = useState(defaultEmailForm(currentEmail));
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateStoredAdminEmail = (newEmail) => {
    const token = getValidAdminToken();

    if (!token) return;

    window.sessionStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        ...(adminProfile || {}),
        email: newEmail
      })
    );
  };

  const handleEmailChange = (key, value) => {
    setEmailForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const sendEmailOtp = async () => {
    if (!emailForm.oldEmail.trim() || !emailForm.newEmail.trim()) {
      setError("Old email and new email are required.");
      return;
    }

    try {
      setLoadingAction("email-otp");
      setError("");
      setSuccess("");

      const response = await api.post("/admin/send-email-otp", {
        oldEmail: emailForm.oldEmail.trim(),
        newEmail: emailForm.newEmail.trim()
      });

      setEmailOtpSent(true);
      setSuccess(response?.data?.message || "OTP sent to old email.");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to send email OTP.");
    } finally {
      setLoadingAction("");
    }
  };

  const submitEmailChange = async (event) => {
    event.preventDefault();

    if (!emailForm.oldEmail.trim() || !emailForm.newEmail.trim() || !emailForm.otp.trim()) {
      setError("Old email, new email, and OTP are required.");
      return;
    }

    try {
      setLoadingAction("email-save");
      setError("");
      setSuccess("");

      const response = await api.post("/admin/change-email", {
        oldEmail: emailForm.oldEmail.trim(),
        newEmail: emailForm.newEmail.trim(),
        otp: emailForm.otp.trim()
      });

      updateStoredAdminEmail(emailForm.newEmail.trim().toLowerCase());
      setEmailForm(defaultEmailForm(emailForm.newEmail.trim().toLowerCase()));
      setEmailOtpSent(false);
      setSuccess(response?.data?.message || "Email changed successfully.");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to change email.");
    } finally {
      setLoadingAction("");
    }
  };

  const sendPasswordOtp = async () => {
    if (!passwordForm.oldPassword.trim() || !passwordForm.newPassword.trim()) {
      setError("Old password and new password are required.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoadingAction("password-otp");
      setError("");
      setSuccess("");

      const response = await api.post("/admin/send-password-otp", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordOtpSent(true);
      setSuccess(response?.data?.message || "OTP sent to your email.");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to send password OTP.");
    } finally {
      setLoadingAction("");
    }
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();

    if (!passwordForm.oldPassword.trim() || !passwordForm.otp.trim() || !passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      setError("Old password, OTP, new password, and confirm password are required.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoadingAction("password-save");
      setError("");
      setSuccess("");

      const response = await api.post("/admin/change-password", {
        oldPassword: passwordForm.oldPassword,
        otp: passwordForm.otp.trim(),
        newPassword: passwordForm.newPassword
      });

      setPasswordForm(defaultPasswordForm);
      setPasswordOtpSent(false);
      setSuccess(response?.data?.message || "Password changed successfully.");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to change password.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage admin email and password from one place."
      />

      {error ? <p className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p> : null}
      {success ? <p className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">{success}</p> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Change Email</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Send an OTP to the current admin email, then confirm the new one.
              </p>
            </div>
          </div>

          <form onSubmit={submitEmailChange} className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">Current Email</span>
              <input
                value={emailForm.oldEmail}
                onChange={(event) => handleEmailChange("oldEmail", event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">New Email</span>
              <input
                value={emailForm.newEmail}
                onChange={(event) => handleEmailChange("newEmail", event.target.value)}
                placeholder="Enter new admin email"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={sendEmailOtp}
                disabled={loadingAction === "email-otp"}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
              >
                <Send size={15} /> {loadingAction === "email-otp" ? "Sending..." : "Send OTP"}
              </button>
              {emailOtpSent ? (
                <span className="inline-flex items-center rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-500">
                  OTP sent to current email
                </span>
              ) : null}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">OTP</span>
              <input
                value={emailForm.otp}
                onChange={(event) => handleEmailChange("otp", event.target.value)}
                placeholder="Enter OTP"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <button
              type="submit"
              disabled={loadingAction === "email-save"}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loadingAction === "email-save" ? "Updating..." : "Update Email"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Change Password</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Request an OTP on your email and use it to set a new password.
              </p>
            </div>
          </div>

          <form onSubmit={submitPasswordChange} className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">Old Password</span>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) => handlePasswordChange("oldPassword", event.target.value)}
                placeholder="Enter current password"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">New Password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
                placeholder="Enter new password"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">Confirm New Password</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
                placeholder="Re-enter new password"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={sendPasswordOtp}
                disabled={loadingAction === "password-otp"}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
              >
                <Send size={15} /> {loadingAction === "password-otp" ? "Sending..." : "Send OTP"}
              </button>
              {passwordOtpSent ? (
                <span className="inline-flex items-center rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-500">
                  OTP sent to admin email
                </span>
              ) : null}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-500 dark:text-slate-400">OTP</span>
              <input
                value={passwordForm.otp}
                onChange={(event) => handlePasswordChange("otp", event.target.value)}
                placeholder="Enter OTP"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <button
              type="submit"
              disabled={loadingAction === "password-save"}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loadingAction === "password-save" ? "Verifying..." : "Verify OTP & Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
