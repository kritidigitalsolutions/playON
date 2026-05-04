const User = require("../../models/user.model");
const Match = require("../../models/match.model");
const Stream = require("../../models/stream.model");
const Channel = require("../../models/channel.model");
const Subscription = require("../../models/subscription.model");

const toTitleCase = (value = "") =>
  value
    .toString()
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const formatNumber = (value = 0) => Number(value || 0).toLocaleString("en-US");

const getRelativeTime = (value) => {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const getGrowthData = async (Model, filter = {}) => {
  const now = Date.now();
  const last30Start = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const prev30Start = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    Model.countDocuments({
      ...filter,
      createdAt: { $gte: last30Start }
    }),
    Model.countDocuments({
      ...filter,
      createdAt: { $gte: prev30Start, $lt: last30Start }
    })
  ]);

  if (previous === 0) {
    return {
      growth: `+${current} in last 30d`,
      trend: current > 0 ? "up" : "down"
    };
  }

  const percentage = ((current - previous) / previous) * 100;

  return {
    growth: `${percentage >= 0 ? "+" : ""}${percentage.toFixed(1)}% vs prev 30d`,
    trend: percentage >= 0 ? "up" : "down"
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
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthMap.get(key);
    if (bucket) bucket.users += 1;
  });

  matches.forEach((match) => {
    const date = new Date(match.createdAt);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthMap.get(key);
    if (bucket) bucket.matches += 1;
  });

  return months;
};

exports.getDashboard = async (req, res) => {
  try {
    const userFilter = {};
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    // Rolling windows for dynamic statistics
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeSixtyFiveDaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalMatches,
      totalChannels,
      usersGrowth,
      matchesGrowth,
      liveMatches,
      upcomingMatches,
      liveStreams,
      scheduledStreams,
      liveChannels,
      totalStreamViewers,
      usersForLine,
      recentUsers,
      recentMatchesForLine,
      sportDistributionRaw,
      recentMatches,
      latestMatch,
      liveTopStream,
      viewerByMatchRaw,
      todayUsers,
      yesterdayUsers,
      incomeAggregation,
      completedMatches,
      cancelledMatches,
      totalStreams,
      endedStreams,
      offlineStreams,
      offlineChannels,
      maintenanceChannels
    ] = await Promise.all([
      User.countDocuments(userFilter),
      Match.countDocuments(),
      Channel.countDocuments(),
      getGrowthData(User, userFilter),
      getGrowthData(Match),
      Match.countDocuments({ status: "live" }),
      Match.countDocuments({ status: "upcoming" }),
      Stream.countDocuments({ status: "live" }),
      Stream.countDocuments({ status: "scheduled" }),
      Channel.countDocuments({ status: "live" }),
      Stream.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$viewerCount" }
          }
        }
      ]),
      User.find(userFilter)
        .select("createdAt")
        .sort({ createdAt: -1 })
        .limit(500),
      User.find(userFilter)
        .select("fullName mobile createdAt")
        .sort({ createdAt: -1 })
        .limit(6),
      Match.find()
        .select("createdAt")
        .sort({ createdAt: -1 })
        .limit(500),
      Match.aggregate([
        {
          $group: {
            _id: "$sport",
            matches: { $sum: 1 }
          }
        },
        { $sort: { matches: -1 } }
      ]),
      Match.find()
        .select("title teamA teamB sport status createdAt matchDate")
        .sort({ matchDate: -1, createdAt: -1 })
        .limit(6),
      Match.findOne()
        .select("title teamA teamB createdAt")
        .sort({ createdAt: -1 }),
      Stream.findOne({ status: "live" })
        .select("title viewerCount")
        .sort({ viewerCount: -1 }),
      Stream.aggregate([
        {
          $group: {
            _id: "$matchId",
            viewers: { $sum: "$viewerCount" }
          }
        }
      ]),
      User.countDocuments({ ...userFilter, createdAt: { $gte: startOfToday } }),
      User.countDocuments({ ...userFilter, createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
      Subscription.aggregate([
        {
          $facet: {
            today: [
              { $match: { createdAt: { $gte: startOfToday } } },
              { $group: { _id: null, sum: { $sum: "$amountPaid" } } }
            ],
            yesterday: [
              { $match: { createdAt: { $gte: startOfYesterday, $lt: startOfToday } } },
              { $group: { _id: null, sum: { $sum: "$amountPaid" } } }
            ],
            weekly: [
              { $match: { createdAt: { $gte: sevenDaysAgo } } },
              { $group: { _id: null, sum: { $sum: "$amountPaid" } } }
            ],
            monthly: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $group: { _id: null, sum: { $sum: "$amountPaid" } } }
            ],
            yearly: [
              { $match: { createdAt: { $gte: threeSixtyFiveDaysAgo } } },
              { $group: { _id: null, sum: { $sum: "$amountPaid" } } }
            ],
            total: [
              { $group: { _id: null, sum: { $sum: "$amountPaid" } } }
            ]
          }
        }
      ]),
      Match.countDocuments({ status: "completed" }),
      Match.countDocuments({ status: "cancelled" }),
      Stream.countDocuments(),
      Stream.countDocuments({ status: "ended" }),
      Stream.countDocuments({ status: "offline" }),
      Channel.countDocuments({ status: "offline" }),
      Channel.countDocuments({ status: "maintenance" })
    ]);

    const viewerByMatch = Object.fromEntries(
      viewerByMatchRaw
        .filter((item) => item?._id)
        .map((item) => [String(item._id), Number(item.viewers || 0)])
    );

    const stats = [
      {
        title: "Total Users",
        value: totalUsers,
        growth: usersGrowth.growth,
        trend: usersGrowth.trend
      },
      {
        title: "Total Matches",
        value: totalMatches,
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
        growth: `${totalChannels} total`,
        trend: liveChannels > 0 ? "up" : "down"
      }
    ];

    const line = buildLastSixMonthSeries(usersForLine, recentMatchesForLine);

    const bars = sportDistributionRaw.map((item) => ({
      sport: toTitleCase(item._id || "other"),
      matches: item.matches
    }));

    const matches = recentMatches.map((match) => ({
      id: `M-${String(match._id).slice(-6).toUpperCase()}`,
      teams: `${match.teamA || "Team A"} vs ${match.teamB || "Team B"}`,
      sport: toTitleCase(match.sport || "other"),
      status: (match.status || "upcoming").toLowerCase(),
      viewers: viewerByMatch[String(match._id)] || 0
    }));

    const latestUser = recentUsers[0] || null;

    const activities = [
      {
        id: "act-live-matches",
        text: `${liveMatches} match${liveMatches === 1 ? "" : "es"} currently live.`,
        time: "Now"
      },
      {
        id: "act-live-streams",
        text: `${liveStreams} stream${liveStreams === 1 ? "" : "s"} running with ${formatNumber(
          totalStreamViewers[0]?.total || 0
        )} total viewers.`,
        time: "Now"
      },
      latestMatch
        ? {
          id: "act-latest-match",
          text: `Latest match added: ${latestMatch.title || `${latestMatch.teamA} vs ${latestMatch.teamB}`}.`,
          time: getRelativeTime(latestMatch.createdAt)
        }
        : null,
      latestUser
        ? {
          id: "act-latest-user",
          text: `New user joined: ${latestUser.fullName || latestUser.mobile || "User"}.`,
          time: getRelativeTime(latestUser.createdAt)
        }
        : null,
      liveTopStream
        ? {
          id: "act-top-stream",
          text: `Top live stream: ${liveTopStream.title || "Untitled Stream"} (${formatNumber(
            liveTopStream.viewerCount || 0
          )} viewers).`,
          time: "Live"
        }
        : null
    ].filter(Boolean);

    const registrationStats = {
      today: todayUsers,
      yesterday: yesterdayUsers,
      total: totalUsers
    };

    const inc = incomeAggregation[0] || {};
    const incomeStats = {
      today: inc.today?.[0]?.sum || 0,
      yesterday: inc.yesterday?.[0]?.sum || 0,
      weekly: inc.weekly?.[0]?.sum || 0,
      monthly: inc.monthly?.[0]?.sum || 0,
      yearly: inc.yearly?.[0]?.sum || 0,
      total: inc.total?.[0]?.sum || 0
    };

    const matchDetails = {
      total: totalMatches,
      live: liveMatches,
      upcoming: upcomingMatches,
      completed: completedMatches,
      cancelled: cancelledMatches
    };

    const streamDetails = {
      total: totalStreams,
      live: liveStreams,
      scheduled: scheduledStreams,
      ended: endedStreams,
      offline: offlineStreams
    };

    const channelDetails = {
      total: totalChannels,
      live: liveChannels,
      offline: offlineChannels,
      maintenance: maintenanceChannels
    };

    res.json({
      success: true,
      stats,
      line,
      bars,
      activities,
      matches,
      registrationStats,
      incomeStats,
      matchDetails,
      streamDetails,
      channelDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
