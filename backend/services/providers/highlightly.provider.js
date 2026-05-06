const axios = require("axios");

const API_KEY = process.env.HIGHLIGHTLY_API_KEY;

const BASE_URLS = {
  cricket:    process.env.HIGHLIGHTLY_CRICKET_URL,
  football:   process.env.HIGHLIGHTLY_FOOTBALL_URL,
  basketball: process.env.HIGHLIGHTLY_BASKETBALL_URL,
  hockey:     process.env.HIGHLIGHTLY_HOCKEY_URL,
  rugby:      process.env.HIGHLIGHTLY_RUGBY_URL,
  volleyball: process.env.HIGHLIGHTLY_VOLLEYBALL_URL,
  handball:   process.env.HIGHLIGHTLY_HANDBALL_URL,
  default:    process.env.HIGHLIGHTLY_SPORT_URL
};

function detectSport(sportField) {
  if (!sportField) return "default";
  const s = sportField.toLowerCase();
  if (s.includes("cricket"))                        return "cricket";
  if (s.includes("football") || s.includes("soccer")) return "football";
  if (s.includes("basketball"))                     return "basketball";
  if (s.includes("hockey"))                         return "hockey";
  if (s.includes("rugby"))                          return "rugby";
  if (s.includes("volleyball"))                     return "volleyball";
  if (s.includes("handball"))                       return "handball";
  return "default";
}

const cache = new Map();
const CACHE_TTL = 60 * 1000;

function getCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache.set(key, { data, ts: Date.now() });
}

async function request(sport, path, params = {}) {
    const cacheKey = `${sport}:${path}:${JSON.stringify(params)}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const baseURL = BASE_URLS[sport] || BASE_URLS.default;

    const res = await axios.get(`${baseURL}${path}`, {
        headers: {
            "x-rapidapi-key": API_KEY,
            "Content-Type": "application/json"
        },
        params
    });

    // Unwrap if response is wrapped in { data: [...] }
    const unwrapped = res.data?.data !== undefined ? res.data.data : res.data;

    setCache(cacheKey, unwrapped);
    return unwrapped;
}


// ─── 1. Live Scores ────────────────────────────────────────────
exports.getLiveMatches = async (sport = "cricket") => {
    const detectedSport = detectSport(sport);
    const today = new Date().toISOString().split("T")[0];
    const data = await request(detectedSport, "/matches", {
        date: today,
        limit: 20
    });
    const matches = Array.isArray(data) ? data : [];
    return matches.filter(
        (m) =>
            m.state?.description === "Live" ||
            m.state?.description === "In Progress" ||
            m.status === "live" ||
            m.status === "inprogress"
    );
};

// ─── 2. Score By Match ID ──────────────────────────────────────
exports.getMatchById = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);
    const data = await request(detectedSport, `/matches/${highlightlyMatchId}`);
    if (!data) return null;

    // Handle if response is array (list endpoint) or object (single match)
    const match = Array.isArray(data) ? data[0] : data;
    if (!match) return null;

    const state = match.state || {};
    return {
        matchId: highlightlyMatchId,
        title: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
        sport: match.format || sport,
        status: state.description || "",
        homeTeam: match.homeTeam?.name || "",
        awayTeam: match.awayTeam?.name || "",
        homeLogo: match.homeTeam?.logo || "",
        awayLogo: match.awayTeam?.logo || "",
        homeScore: state.teams?.home?.score || "",
        awayScore: state.teams?.away?.score || "",
        homeInfo: state.teams?.home?.info || "",
        awayInfo: state.teams?.away?.info || "",
        report: state.report || "",
        league: match.league?.name || "",
        format: match.format || "",
        startDate: match.startDate || "",
        country: match.country?.name || ""
    };
};

// ─── 3. Scoreboard ─────────────────────────────────────────────
exports.getScoreboard = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);
    const data = await request(detectedSport, `/matches/${highlightlyMatchId}`);
    if (!data) return null;

    const match = Array.isArray(data) ? data[0] : data;
    if (!match) return null;

    const state = match.state || {};
    const innings = (match.statistics || []).map((inning) => ({
        inningNumber: inning.inningNumber,
        team: inning.team?.name,
        teamLogo: inning.team?.logo,
        batsmen: (inning.team?.inningBatsmen || []).map((b) => ({
            name: b.player?.name,
            runs: b.runs,
            balls: b.balls,
            fours: b.fours,
            sixes: b.sixes,
            strikeRate: b.battingStrikeRate,
            dismissal: b.dismissalStatus
        })),
        bowlers: (inning.team?.inningBowlers || []).map((b) => ({
            name: b.player?.name,
            overs: b.overs,
            wickets: b.wickets,
            runs: b.concededRuns,
            economy: b.economy,
            maidens: b.maidens
        })),
        fallOfWickets: inning.team?.fallOfWickets || [],
        extras: inning.team?.extras || 0,
        wides: inning.team?.wides || 0,
        noBalls: inning.team?.noBalls || 0
    }));

    return {
        matchId: highlightlyMatchId,
        homeTeam: match.homeTeam?.name || "",
        awayTeam: match.awayTeam?.name || "",
        homeLogo: match.homeTeam?.logo || "",
        awayLogo: match.awayTeam?.logo || "",
        homeScore: state.teams?.home?.score || "",
        awayScore: state.teams?.away?.score || "",
        report: state.report || "",
        status: state.description || "",
        innings
    };
};

// ─── 4. Current Players / Squad ────────────────────────────────
exports.getPlayers = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);

    if (detectedSport === "football") {
        const data = await request("football", `/lineups/${highlightlyMatchId}`);
        return data || null;
    }

    const data = await request("cricket", `/matches/${highlightlyMatchId}`);
    if (!data) return null;

    const match = Array.isArray(data) ? data[0] : data;
    if (!match) return null;

    const squad = (match.squad || []).map((teamSquad) => ({
        team: teamSquad.team?.name,
        teamLogo: teamSquad.team?.logo,
        players: (teamSquad.players || []).map((p) => ({
            name: p.name,
            roles: p.roles,
            battingStyle: p.battingStyles?.[0] || "",
            bowlingStyle: p.bowlingStyles?.[0] || ""
        }))
    }));

    return {
        matchId: highlightlyMatchId,
        homeTeam: match.homeTeam?.name || "",
        awayTeam: match.awayTeam?.name || "",
        squad
    };
};

// ─── 5. Match Stats ────────────────────────────────────────────
exports.getStats = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);

    if (detectedSport === "football") {
        const data = await request("football", `/statistics/${highlightlyMatchId}`);
        return data || null;
    }

    const data = await request("cricket", `/matches/${highlightlyMatchId}`);
    if (!data) return null;

    const match = Array.isArray(data) ? data[0] : data;
    if (!match) return null;

    const statsPerInning = (match.statistics || []).map((inning) => {
        const team = inning.team;
        const batsmen = team?.inningBatsmen || [];
        const bowlers = team?.inningBowlers || [];

        const totalRuns = batsmen.reduce((sum, b) => sum + (b.runs || 0), 0);
        const totalFours = batsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
        const totalSixes = batsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);
        const totalWickets = bowlers.reduce((sum, b) => sum + (b.wickets || 0), 0);

        return {
            inningNumber: inning.inningNumber,
            team: team?.name,
            totalRuns,
            totalFours,
            totalSixes,
            totalWickets,
            extras: team?.extras || 0,
            wides: team?.wides || 0,
            noBalls: team?.noBalls || 0
        };
    });

    return {
        matchId: highlightlyMatchId,
        format: match.format || "",
        stats: statsPerInning
    };
};

// ─── 6. Top Performers ─────────────────────────────────────────
exports.getTopPerformers = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);
    const data = await request(detectedSport, `/matches/${highlightlyMatchId}`);
    if (!data) return null;

    const match = Array.isArray(data) ? data[0] : data;
    if (!match) return null;

    const bestBatsmen = (match.bestBatsmen || []).flatMap((teamEntry) =>
        (teamEntry.players || []).map((p) => ({
            name: p.name,
            team: teamEntry.team?.name,
            teamLogo: teamEntry.team?.logo,
            roles: p.roles,
            runs: p.statistics?.runs,
            average: p.statistics?.average,
            strikeRate: p.statistics?.battingStrikeRate,
            innings: p.statistics?.innings
        }))
    );

    const bestBowlers = (match.bestBowlers || []).flatMap((teamEntry) =>
        (teamEntry.players || []).map((p) => ({
            name: p.name,
            team: teamEntry.team?.name,
            teamLogo: teamEntry.team?.logo,
            roles: p.roles,
            wickets: p.statistics?.wickets,
            economy: p.statistics?.economy,
            average: p.statistics?.average,
            innings: p.statistics?.innings
        }))
    );

    return {
        matchId: highlightlyMatchId,
        topPerformers: {
            batsmen: bestBatsmen,
            bowlers: bestBowlers
        }
    };
};

// ─── 7. Text Events ────────────────────────────────────────────
exports.getEvents = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);

    if (detectedSport === "football") {
        const data = await request("football", `/live-events/${highlightlyMatchId}`);
        return data || null;
    }

    const data = await request("cricket", `/matches/${highlightlyMatchId}`);
    if (!data) return null;

    const match = Array.isArray(data) ? data[0] : data;
    if (!match) return null;

    const events = (match.statistics || []).flatMap((inning) =>
        (inning.team?.fallOfWickets || []).map((fow) => ({
            type: "WICKET",
            inning: inning.inningNumber,
            runs: fow.runs,
            overs: fow.overs,
            batsman: fow.dismissalBatsman?.name,
            text: `Inning ${inning.inningNumber} - ${fow.overs} ov: ${fow.dismissalBatsman?.name} out at ${fow.runs}`
        }))
    );

    return {
        matchId: highlightlyMatchId,
        events
    };
};

// ─── 8. Video Highlights ───────────────────────────────────────
exports.getHighlights = async (highlightlyMatchId, sport = "cricket") => {
    const detectedSport = detectSport(sport);
    const data = await request(detectedSport, "/highlights", {
        matchId: highlightlyMatchId,
        limit: 10
    });

    const highlights = Array.isArray(data) ? data : [];

    return {
        matchId: highlightlyMatchId,
        highlights: highlights.map((h) => ({
            id: h.id,
            title: h.title,
            description: h.description || "",
            category: h.type === "VERIFIED" ? "full_match" : "other",
            thumbnail: h.image || h.thumbnail || "",
            videoUrl: h.url || h.embedUrl || "",
            duration: h.duration || "",
            source: h.source || "",
            tags: h.tags || []
        }))
    };
};

// ─── 9. Search Matches ─────────────────────────────────────────
exports.searchMatches = async (sport = "cricket", date) => {
    const detectedSport = detectSport(sport);
    const data = await request(detectedSport, "/matches", {
        date: date,
        limit: 50
    });

    const matches = Array.isArray(data) ? data : [];
    
    return matches.map(m => ({
        highlightlyId: m.id,
        title: `${m.homeTeam?.name} vs ${m.awayTeam?.name}`,
        status: m.state?.description || m.status,
        league: m.league?.name,
        format: m.format,
        startDate: m.startDate
    }));
};