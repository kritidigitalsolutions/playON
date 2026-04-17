import { useState } from "react";
import PageHeader from "../components/PageHeader";

function Settings() {
  const [profile, setProfile] = useState({ name: "PlayON Super Admin", email: "admin@playon.com" });
  const [config, setConfig] = useState({ appName: "PlayON", defaultSport: "Cricket", maintenance: false });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage profile, theme, and app-level configurations." />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Profile Settings</h3>
          <div className="mt-4 space-y-3">
            <input
              value={profile.name}
              onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={profile.email}
              onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm text-white">Save Profile</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">App Config</h3>
          <div className="mt-4 space-y-3">
            <input
              value={config.appName}
              onChange={(event) => setConfig((prev) => ({ ...prev, appName: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={config.defaultSport}
              onChange={(event) => setConfig((prev) => ({ ...prev, defaultSport: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option>Cricket</option>
              <option>Football</option>
              <option>Basketball</option>
              <option>Tennis</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={config.maintenance}
                onChange={(event) => setConfig((prev) => ({ ...prev, maintenance: event.target.checked }))}
              />
              Enable maintenance mode
            </label>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">Save Config</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
