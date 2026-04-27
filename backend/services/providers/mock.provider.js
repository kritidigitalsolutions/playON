const liveMatches = [
  {
    matchId: "match_1",
    title: "India vs Australia",
    sport: "cricket",
    status: "live",
    score: "145/4",
    overs: "16.2"
  },
  {
    matchId: "match_2",
    title: "Real Madrid vs Barcelona",
    sport: "football",
    status: "live",
    score: "2 - 1",
    minute: "78'"
  }
];

exports.getLiveMatches = async () => {
  return liveMatches;
};

exports.getMatchById = async (matchId) => {
  return liveMatches.find(
    (item) => item.matchId === matchId
  );
};

exports.getScoreboard = async (matchId) => {
  if (matchId === "match_1") {
    return {
      matchId: "match_1",
      innings: "India Innings",
      score: "145/4",
      overs: "16.2",
      striker: "Virat Kohli 54(32)",
      nonStriker: "Hardik Pandya 18(10)",
      bowler: "Starc 3.2-0-28-1"
    };
  }

  return null;
};

exports.getPlayers = async (matchId) => {
  if (matchId === "match_1") {
    return {
      matchId: "match_1",
      currentPlayers: {
        striker: "Virat Kohli",
        nonStriker: "Hardik Pandya",
        bowler: "Mitchell Starc"
      }
    };
  }

  return null;
};

exports.getEvents = async (matchId) => {
  if (matchId === "match_1") {
    return {
      matchId: "match_1",
      events: [
        "16.3 FOUR by Kohli",
        "16.5 SIX by Hardik",
        "17.1 WICKET - Hardik Out"
      ]
    };
  }

  return null;
};

exports.getTopPerformers = async (matchId) => {
  if (matchId === "match_1") {
    return {
      matchId: "match_1",
      topPerformers: {
        batter: "Virat Kohli - 54(32)",
        bowler: "Mitchell Starc - 1/28",
        impactPlayer: "Hardik Pandya - 18(10)"
      }
    };
  }

  return null;
};

exports.getStats = async (matchId) => {
  if (matchId === "match_1") {
    return {
      matchId: "match_1",
      stats: {
        runRate: "8.90",
        fours: 12,
        sixes: 5,
        wickets: 4,
        extras: 7
      }
    };
  }

  return null;
};

exports.getHighlights = async (matchId) => {
  if (matchId === "match_1") {
    return {
      matchId: "match_1",
      highlights: [
        {
          title: "Match Highlights",
          thumbnail:
            "https://via.placeholder.com/300x200",
          videoUrl:
            "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
          duration: "05:20"
        }
      ]
    };
  }

  return null;
};