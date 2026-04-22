import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios";
import { getAdminProfile } from "../utils/auth";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { dashboardLine, dashboardStats, latestMatches, recentActivities, sportsDistribution } from "../utils/adminFallbackData";
import { STATUS_STYLES } from "../utils/constants";
import { getBadgeClass, formatNumber } from "../utils/helpers";

function Dashboard() {
  const admin = getAdminProfile();
  const adminName = admin?.name || admin?.username || "PlayON Admin";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    stats: dashboardStats,
    line: dashboardLine,
    bars: sportsDistribution,
    activities: recentActivities,
    matches: latestMatches,
    registrationStats: { today: 0, yesterday: 0, total: 0 },
    incomeStats: { today: 0, yesterday: 0, weekly: 0, monthly: 0, yearly: 0, total: 0 },
    matchDetails: { total: 0, live: 0, upcoming: 0, completed: 0, cancelled: 0 },
    streamDetails: { total: 0, live: 0, scheduled: 0, ended: 0, offline: 0 },
    channelDetails: { total: 0, live: 0, offline: 0, maintenance: 0 }
  });

  const [subStats, setSubStats] = useState({
    subscribed: 0,
    notSubscribed: 0,
    expired: 0
  });

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        const [dashRes, subRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/subscriptions/stats/overview").catch(() => null)
        ]);

        const payload = dashRes?.data;
        const subPayload = subRes?.data?.stats;

        if (mounted) {
          setData({
            stats: payload?.stats?.length ? payload.stats : dashboardStats,
            line: payload?.line?.length ? payload.line : dashboardLine,
            bars: payload?.bars?.length ? payload.bars : sportsDistribution,
            activities: payload?.activities?.length ? payload.activities : recentActivities,
            matches: payload?.matches?.length ? payload.matches : latestMatches,
            registrationStats: payload?.registrationStats || { today: 0, yesterday: 0, total: 0 },
            incomeStats: payload?.incomeStats || { today: 0, yesterday: 0, weekly: 0, monthly: 0, yearly: 0, total: 0 },
            matchDetails: payload?.matchDetails || { total: 0, live: 0, upcoming: 0, completed: 0, cancelled: 0 },
            streamDetails: payload?.streamDetails || { total: 0, live: 0, scheduled: 0, ended: 0, offline: 0 },
            channelDetails: payload?.channelDetails || { total: 0, live: 0, offline: 0, maintenance: 0 }
          });

          if (subPayload) {
            const totalUsers = payload?.stats?.find(s => s.title === "Total Users")?.value || 0;
            setSubStats({
              subscribed: subPayload.active || 0,
              notSubscribed: Math.max(0, totalUsers - (subPayload.active || 0)),
              expired: subPayload.expired || 0
            });
          }
        }
      } catch (apiError) {
        setError(apiError?.response?.data?.message || "Using fallback dashboard data.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const matchColumns = useMemo(
    () => [
      { key: "id", label: "Match ID" },
      { key: "teams", label: "Teams" },
      { key: "sport", label: "Sport" },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <span className={`rounded-full px-2.5 py-1 text-xs ${getBadgeClass(row.status, STATUS_STYLES)}`}>{row.status}</span>
        )
      },
      { key: "viewers", label: "Viewers", render: (row) => formatNumber(row.viewers) }
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${adminName}`}
        subtitle="Track your platform health, users, and live broadcasts in one place."
      />

      {error ? <p className="mb-4 text-sm text-amber-500">{error}</p> : null}

      {loading ? (
        <Loader lines={6} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {data.stats.map((stat, index) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                growth={stat.growth}
                trend={stat.trend}
                index={index}
                currency={stat.title.toLowerCase().includes("revenue")}
              />
            ))}
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Subscription Overview</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Total Subscribe Users"
                value={subStats.subscribed}
                growth="Active Subscriptions"
                trend="up"
                index={0}
              />
              <StatCard
                title="Total Not Subscribe Users"
                value={subStats.notSubscribed}
                growth="Without Subs"
                trend="down"
                index={1}
              />
              <StatCard
                title="Expiry Subscription Counts"
                value={subStats.expired}
                growth="Expired Subs"
                trend="down"
                index={2}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Registration Overview</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Today Registration"
                value={data.registrationStats.today}
                growth="New Users"
                trend="up"
                index={0}
              />
              <StatCard
                title="Yesterday Registration"
                value={data.registrationStats.yesterday}
                growth="Previous Day"
                trend="up"
                index={1}
              />
              <StatCard
                title="Total Registration"
                value={data.registrationStats.total}
                growth="All Time Users"
                trend="up"
                index={2}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Income Overview</h3>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
              <StatCard
                title="Today Income"
                value={data.incomeStats.today}
                growth="Today"
                trend="up"
                index={0}
                currency={true}
              />
              <StatCard
                title="Yesterday Income"
                value={data.incomeStats.yesterday}
                growth="Previous Day"
                trend="up"
                index={1}
                currency={true}
              />
              <StatCard
                title="Weekly Income"
                value={data.incomeStats.weekly}
                growth="This Week"
                trend="up"
                index={2}
                currency={true}
              />
              <StatCard
                title="Monthly Income"
                value={data.incomeStats.monthly}
                growth="This Month"
                trend="up"
                index={3}
                currency={true}
              />
              <StatCard
                title="Yearly Income"
                value={data.incomeStats.yearly}
                growth="This Year"
                trend="up"
                index={4}
                currency={true}
              />
              <StatCard
                title="Total Income"
                value={data.incomeStats.total}
                growth="All Time"
                trend="up"
                index={5}
                currency={true}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Match Overview</h3>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              <StatCard title="Total Matches" value={data.matchDetails.total} growth="All Matches" trend="up" index={0} />
              <StatCard title="Live Matches" value={data.matchDetails.live} growth="Playing Now" trend="up" index={1} />
              <StatCard title="Upcoming Matches" value={data.matchDetails.upcoming} growth="Scheduled" trend="up" index={2} />
              <StatCard title="Completed Matches" value={data.matchDetails.completed} growth="Finished" trend="up" index={3} />
              <StatCard title="Cancelled Matches" value={data.matchDetails.cancelled} growth="Dropped" trend="down" index={4} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Stream Overview</h3>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              <StatCard title="Total Streams" value={data.streamDetails.total} growth="All Streams" trend="up" index={0} />
              <StatCard title="Live Streams" value={data.streamDetails.live} growth="Running Now" trend="up" index={1} />
              <StatCard title="Scheduled Streams" value={data.streamDetails.scheduled} growth="Ready to Go" trend="up" index={2} />
              <StatCard title="Ended Streams" value={data.streamDetails.ended} growth="Finished" trend="up" index={3} />
              <StatCard title="Offline Streams" value={data.streamDetails.offline} growth="Not Connected" trend="down" index={4} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Channel Overview</h3>
            <div className="grid gap-4 sm:grid-cols-4 xl:grid-cols-4">
              <StatCard title="Total Channels" value={data.channelDetails.total} growth="All Channels" trend="up" index={0} />
              <StatCard title="Live Channels" value={data.channelDetails.live} growth="Running Now" trend="up" index={1} />
              <StatCard title="Offline Channels" value={data.channelDetails.offline} growth="Not Running" trend="down" index={2} />
              <StatCard title="Maintenance Channels" value={data.channelDetails.maintenance} growth="Under Fixing" trend="down" index={3} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <ChartCard title="Matches & Users" subtitle="Last 6 months registrations and match volume">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.line}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line type="monotone" dataKey="matches" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Matches by Sport" subtitle="Live and scheduled load">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bars}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
                  <XAxis dataKey="sport" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="matches" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[2fr,1fr]">
            <DataTable
              columns={matchColumns}
              rows={data.matches}
              emptyTitle="No latest matches"
              emptyMessage="Latest matches will appear here when available."
            />

            {data.activities.length ? (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
                <div className="mt-4 space-y-3">
                  {data.activities.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{item.text}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <EmptyState title="No activity yet" message="System actions will appear here." />
            )}
          </div>


        </>
      )}
    </div>
  );
}

export default Dashboard;
