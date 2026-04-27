const provider = require("./providers/mock.provider");

exports.getLiveScores = async () => {
  return await provider.getLiveMatches();
};

exports.getScoreByMatch = async (matchId) => {
  return await provider.getMatchById(matchId);
};

exports.getScoreboard = async (matchId) => {
  return await provider.getScoreboard(matchId);
};

exports.getPlayers = async (matchId) => {
  return await provider.getPlayers(matchId);
};

exports.getEvents = async (matchId) => {
  return await provider.getEvents(matchId);
};

exports.getTopPerformers = async (matchId) => {
  return await provider.getTopPerformers(matchId);
};

exports.getStats = async (matchId) => {
  return await provider.getStats(matchId);
};

exports.getHighlights = async (matchId) => {
  return await provider.getHighlights(matchId);
};