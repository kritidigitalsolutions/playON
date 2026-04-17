import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bolt, Download, Plus } from "lucide-react";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { dashboardLine, dashboardStats, latestMatches, recentActivities, sportsDistribution } from "../utils/adminFallbackData";
import { STATUS_STYLES } from "../utils/constants";
import { getBadgeClass, formatNumber } from "../utils/helpers";

const toTitleCase = (value = "") =>
  value
    .toString()
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const getRelativeTime = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const growthFromDates = (rows = []) => {
  const now = Date.now();
  const last30Start = now - 30 * 24 * 60 * 60 * 1000;
  const prev30Start = now - 60 * 24 * 60 * 60 * 1000;

  let current = 0;
  let previous = 0;

  rows.forEach((row) => {
    const date = new Date(row?.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const time = date.getTime();
    if (time >= last30Start) current += 1;
    else if (time >= prev30Start && time < last30Start) previous += 1;
  });

  if (previous === 0) {
    return {
      growth: `+${current} in last 30d`,
      trend: current > 0 ? "up" : "down"
    };
  }

  const pct = ((current - previous) / previous) * 100;
  return {
    growth: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs prev 30d`,
    trend: pct >= 0 ? "up" : "down"
  };
};

const buildLastSixMonthSeries = (users = [], matches = []) => {
  const today = new Date();
  const months = [];

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      name: date.toLocaleString("en-US", { month: "short" }),
      users: 0,
      matches: 0
    });
  }

  const monthMap = new Map(months.map((month) => [month.key, month]));

  users.forEach((user) => {
    const date = new Date(user?.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthMap.get(key);
    if (bucket) bucket.users += 1;
  });

  matches.forEach((match) => {
    const date = new Date(match?.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthMap.get(key);
    if (bucket) bucket.matches += 1;
  });

  return months;
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    stats: dashboardStats,
    line: dashboardLine,
    bars: sportsDistribution,
    activities: recentActivities,
    matches: latestMatches
  });

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        const [usersRes, matchesRes, streamsRes, channelsRes] = await Promise.allSettled([
          api.get("/admin/users"),
          api.get("/admin/matches", { params: { page: 1, limit: 500 } }),
          api.get("/admin/streams", { params: { page: 1, limit: 500 } }),
          api.get("/admin/channels", { params: { page: 1, limit: 500 } })
        ]);

        const users = usersRes.status === "fulfilled" ? usersRes.value?.data?.users || [] : [];
        const matches = matchesRes.status === "fulfilled" ? matchesRes.value?.data?.matches || [] : [];
        const streams = streamsRes.status === "fulfilled" ? streamsRes.value?.data?.streams || [] : [];
        const channels = channelsRes.status === "fulfilled" ? channelsRes.value?.data?.channels || [] : [];

        const usersGrowth = growthFromDates(users);
        const matchesGrowth = growthFromDates(matches);

        const liveMatches = matches.filter((match) => (match?.status || "").toLowerCase() === "live").length;
        const upcomingMatches = matches.filter((match) => (match?.status || "").toLowerCase() === "upcoming").length;
        const liveStreams = streams.filter((stream) => (stream?.status || "").toLowerCase() === "live").length;
        const scheduledStreams = streams.filter((stream) => (stream?.status || "").toLowerCase() === "scheduled").length;
        const liveChannels = channels.filter((channel) => (channel?.status || "").toLowerCase() === "live").length;

        const stats = [
          {
            title: "Total Users",
            value: users.length,
            growth: usersGrowth.growth,
            trend: usersGrowth.trend
          },
          {
            title: "Total Matches",
            value: matches.length,
            growth: matchesGrowth.growth,
            trend: matchesGrowth.trend
          },
          {
            title: "Live Matches",
            value: liveMatches,
            growth: `${upcomingMatches} upcoming`,
            trend: liveMatches > 0 ? "up" : "down"
          },
          {
            title: "Streams Running",
            value: liveStreams,
            growth: `${scheduledStreams} scheduled`,
            trend: liveStreams > 0 ? "up" : "down"
          },
          {
            title: "Live Channels",
            value: liveChannels,
            growth: `${channels.length} total`,
            trend: liveChannels > 0 ? "up" : "down"
          }
        ];

        const line = buildLastSixMonthSeries(users, matches);

        const sportCountMap = matches.reduce((acc, match) => {
          const key = toTitleCase(match?.sport || "Other");
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const bars = Object.entries(sportCountMap)
          .map(([sport, count]) => ({ sport, matches: count }))
          .sort((a, b) => b.matches - a.matches);

        const viewerByMatch = streams.reduce((acc, stream) => {
          const matchId = stream?.matchId?._id || stream?.matchId;
          if (!matchId) return acc;
          const key = String(matchId);
          acc[key] = (acc[key] || 0) + Number(stream?.viewerCount || 0);
          return acc;
        }, {});

        const matchesForTable = [...matches]
          .sort((a, b) => new Date(b.matchDate || b.createdAt) - new Date(a.matchDate || a.createdAt))
          .slice(0, 6)
          .map((match) => ({
            id: `M-${String(match?._id || "").slice(-6).toUpperCase()}`,
            teams: `${match?.teamA || "Team A"} vs ${match?.teamB || "Team B"}`,
            sport: toTitleCase(match?.sport || "Other"),
            status: (match?.status || "upcoming").toLowerCase(),
            viewers: viewerByMatch[String(match?._id)] || 0
          }));

        const latestMatch = [...matches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const latestUser = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const latestLiveStream = [...streams]
          .filter((stream) => (stream?.status || "").toLowerCase() === "live")
          .sort((a, b) => Number(b?.viewerCount || 0) - Number(a?.viewerCount || 0))[0];

        const activities = [
          {
            id: "act-1",
            text: `${liveMatches} match${liveMatches === 1 ? "" : "es"} currently live.`,
            time: "Now"
          },
          {
            id: "act-2",
            text: `${liveStreams} stream${liveStreams === 1 ? "" : "s"} running with ${formatNumber(
              streams.reduce((sum, stream) => sum + Number(stream?.viewerCount || 0), 0)
            )} total viewers.`,
            time: "Now"
          },
          latestMatch
            ? {
                id: "act-3",
                text: `Latest match added: ${latestMatch.title || `${latestMatch.teamA} vs ${latestMatch.teamB}`}.`,
                time: getRelativeTime(latestMatch.createdAt)
              }
            : null,
          latestUser
            ? {
                id: "act-4",
                text: `New user joined: ${latestUser.fullName || latestUser.mobile || "User"}.`,
                time: getRelativeTime(latestUser.createdAt)
              }
            : null,
          latestLiveStream
            ? {
                id: "act-5",
                text: `Top live stream: ${latestLiveStream.title || "Untitled Stream"} (${formatNumber(
                  latestLiveStream.viewerCount || 0
                )} viewers).`,
                time: "Live"
              }
            : null
        ].filter(Boolean);

        if (mounted) {
          setData({
            stats,
            line,
            bars: bars.length ? bars : sportsDistribution,
            activities: activities.length ? activities : recentActivities,
            matches: matchesForTable.length ? matchesForTable : latestMatches
          });
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
        title="Welcome back, PlayON Admin"
        subtitle="Track your platform health, users, and live broadcasts in one place."
        action={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
              <Download size={14} /> Export
            </button>
            <button className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm font-medium text-white">
              <Plus size={14} /> New Match
            </button>
          </div>
        }
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

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white">
              <Bolt size={14} /> Start Broadcast
            </button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">Invite Admin</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">Generate Report</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
