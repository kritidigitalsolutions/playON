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
      matchTitle: "India vs Australia",   // ← frontend needs this
      sport: "cricket",                   // ← frontend needs this
      highlights: [
        {
          id: "hl_1",                     // ← frontend uses as key
          title: "Match Highlights",
          description: "Full match highlights from India vs Australia clash.",
          category: "full_match",         // ← frontend filters by this
          thumbnail: "https://via.placeholder.com/300x200",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "05:20",
          tags: ["india", "australia", "cricket"]  // ← frontend shows these
        },
        {
          id: "hl_2",
          title: "Kohli's Half Century",
          description: "Virat Kohli's brilliant 54 off 32 balls.",
          category: "batting",
          thumbnail: "https://via.placeholder.com/300x200",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "01:45",
          tags: ["kohli", "batting", "fifty"]
        },
        {
          id: "hl_3",
          title: "Hardik's Six",
          description: "Hardik Pandya smashes Starc for a massive six.",
          category: "batting",
          thumbnail: "https://via.placeholder.com/300x200",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "00:30",
          tags: ["hardik", "six", "batting"]
        },
        {
          id: "hl_4",
          title: "Starc's Wicket",
          description: "Mitchell Starc takes the crucial wicket of Hardik.",
          category: "bowling",
          thumbnail: "https://via.placeholder.com/300x200",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "00:45",
          tags: ["starc", "wicket", "bowling"]
        }
      ]
    };
  }

  if (matchId === "match_2") {
    return {
      matchId: "match_2",
      matchTitle: "Real Madrid vs Barcelona",
      sport: "football",
      highlights: [
        {
          id: "hl_5",
          title: "El Clasico Highlights",
          description: "Full highlights from the El Clasico thriller.",
          category: "full_match",
          thumbnail: "https://via.placeholder.com/300x200",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "03:45",
          tags: ["elclasico", "realmadrid", "barcelona"]
        },
        {
          id: "hl_6",
          title: "Vinicius Goal",
          description: "Vinicius Jr scores a stunning opener in the 23rd minute.",
          category: "goal",
          thumbnail: "https://via.placeholder.com/300x200",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "00:52",
          tags: ["vinicius", "goal", "realmadrid"]
        }
      ]
    };
  }

  return null;
};