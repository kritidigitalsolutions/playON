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

const MOCK_HIGHLIGHTS = {
  match_1: {
    matchId: "match_1",
    matchTitle: "India vs Australia",
    sport: "cricket",
    highlights: [
      {
        id: "hl_1_1",
        title: "Full Match Highlights – India vs Australia",
        description: "All the best moments from a thrilling T20I between India and Australia.",
        thumbnail: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "05:20",
        category: "full_match",
        tags: ["cricket", "T20", "India", "Australia"]
      },
      {
        id: "hl_1_2",
        title: "Virat Kohli's Stunning Cover Drive",
        description: "Kohli at his elegant best, dispatching a full delivery through cover for four.",
        thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "00:45",
        category: "batting",
        tags: ["batting", "Kohli", "India"]
      },
      {
        id: "hl_1_3",
        title: "Hardik Pandya's Six Sixes Over",
        description: "Hardik goes berserk in the death overs, smashing six sixes in a single over.",
        thumbnail: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "01:10",
        category: "batting",
        tags: ["batting", "Hardik", "six"]
      },
      {
        id: "hl_1_4",
        title: "Mitchell Starc's Hat-Trick",
        description: "Starc's devastating yorkers produce a hat-trick to put Australia back in the game.",
        thumbnail: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "02:05",
        category: "bowling",
        tags: ["bowling", "Starc", "hat-trick", "Australia"]
      }
    ]
  },
  match_2: {
    matchId: "match_2",
    matchTitle: "Real Madrid vs Barcelona",
    sport: "football",
    highlights: [
      {
        id: "hl_2_1",
        title: "Full Match Highlights – El Clásico",
        description: "Non-stop action from the most anticipated fixture in world football.",
        thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "06:45",
        category: "full_match",
        tags: ["football", "LaLiga", "Real Madrid", "Barcelona"]
      },
      {
        id: "hl_2_2",
        title: "Benzema's Bicycle Kick Goal",
        description: "A moment of sheer brilliance as Benzema scores with an acrobatic bicycle kick.",
        thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "01:30",
        category: "goal",
        tags: ["goal", "Benzema", "Real Madrid"]
      },
      {
        id: "hl_2_3",
        title: "Ter Stegen's World-Class Save",
        description: "Barcelona's goalkeeper pulls off an impossible reflex save to keep his side in the game.",
        thumbnail: "https://images.unsplash.com/photo-1551958219-acbc35d827b0?w=640&q=80",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        duration: "00:55",
        category: "save",
        tags: ["save", "goalkeeper", "Barcelona"]
      }
    ]
  }
};

exports.getHighlights = async (matchId) => {
  return MOCK_HIGHLIGHTS[matchId] || null;
};