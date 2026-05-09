import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye, Flame, Pencil, Plus, RefreshCw, Star, Trash2, Film, X,
  Calendar, MapPin, Trophy, Users, Clock, Info, Home, MessageSquare,
  Shield, Search, Upload
} from "lucide-react";

import api from "../api/axios";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import { STATUS_STYLES } from "../utils/constants";
import { getBadgeClass } from "../utils/helpers";
import CommentModal from "../components/CommentModal";



const SPORT_COLORS = {
  cricket: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
  football: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
  basketball: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400",
  kabaddi: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400",
  tennis: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400",
  volleyball: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400",
  other: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400"
};

const defaultForm = {
  _id: "",
  title: "",
  sport: "cricket",
  description: "",
  teams: [],          // array of team ObjectIds
  tourCountry: "",
  startDate: "",
  endDate: "",
  status: "upcoming",
  isFeatured: false,
  isTrending: false,
  isPremium: false,
  isHomeScreen: false,
  imageFile: null,
  tournamentLogoFile: null,
  matchIds: []
};

const defaultNewTeamForm = {
  name: "",
  shortName: "",
  sport: "cricket",
  country: "",
  logoFile: null,
  logoPreview: ""
};

const scoreSourceCategories = [
  "official_api", "third_party_api", "rapidapi", "manual", "web_scrape",
  "rss_feed", "json_feed", "xml_feed", "iframe", "webview", "socket",
  "websocket", "firebase", "supabase", "google_sheet", "cms", "admin_panel",
  "cron_job", "static_url", "backup", "ai_parser", "custom_provider", "other"
];

const emptyScoreSource = {
  provider: "", category: "third_party_api", url: "", apiKey: "",
  priority: "1", isActive: true, notes: ""
};

const defaultNewMatch = {
  title: "", sport: "cricket", teamA: "", teamB: "",
  teamALogoFile: null, teamBLogoFile: null, tournament: "",
  venue: "", matchDate: "", status: "upcoming",
  thumbnailFile: null, bannerFile: null, scoreSources: [],
  description: "", isFeatured: false, isHomeScreen: false
};

const getStatusForMatchDate = (status, matchDate) => {
  if (status !== "upcoming" || !matchDate) return status || "upcoming";
  const date = new Date(matchDate);
  if (Number.isNaN(date.getTime())) return status;
  return date < new Date() ? "completed" : status;
};

// ─── Create New Team Modal ───────────────────────────────────────────────────
function CreateTeamModal({ open, onClose, onCreated, defaultSport, allSports }) {
  const [form, setForm] = useState({ ...defaultNewTeamForm, sport: defaultSport || "cricket" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ ...defaultNewTeamForm, sport: defaultSport || "cricket" });
      setError("");
    }
  }, [open, defaultSport]);

  const onChange = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Team name is required."); return; }
    try {
      setSubmitting(true);
      setError("");
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("shortName", form.shortName.trim());
      payload.append("sport", form.sport);
      payload.append("country", form.country.trim());
      payload.append("isActive", "true");
      if (form.logoFile) payload.append("logoFile", form.logoFile);
      const res = await api.post("/admin/teams", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const created = res?.data?.team;
      if (created?._id) {
        onCreated(created);
        onClose();
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to create team.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 text-sm";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Create New Team</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Team will be saved and added to this series.</p>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Team Name *</span>
                  <input
                    value={form.name}
                    onChange={e => onChange("name", e.target.value)}
                    placeholder="e.g. Mumbai Indians"
                    className={fieldCls}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Short Name</span>
                  <input
                    value={form.shortName}
                    onChange={e => onChange("shortName", e.target.value)}
                    placeholder="e.g. MI"
                    maxLength={10}
                    className={fieldCls}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                  <select
                    value={form.sport}
                    onChange={e => onChange("sport", e.target.value)}
                    className={fieldCls}
                  >
                    {allSports.map(s => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Country</span>
                  <input
                    value={form.country}
                    onChange={e => onChange("country", e.target.value)}
                    placeholder="e.g. India"
                    className={fieldCls}
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Team Logo</span>
                  <div className="flex items-center gap-3">
                    {form.logoPreview ? (
                      <div className="relative shrink-0">
                        <img src={form.logoPreview} alt="" className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                        <button
                          type="button"
                          onClick={() => onChange("logoFile", null) || onChange("logoPreview", "")}
                          className="absolute -top-2 -right-2 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : null}
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file && file.size > 2 * 1024 * 1024) {
                            setError("Logo too large. Max 2MB."); e.target.value = ""; return;
                          }
                          if (file) {
                            setForm(p => ({ ...p, logoFile: file, logoPreview: URL.createObjectURL(file) }));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="h-11 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 transition">
                        <Upload size={14} /> Upload Logo
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {error ? <p className="text-xs text-rose-500">{error}</p> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="admin-secondary-btn">Cancel</button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create Team"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Team Picker Section ─────────────────────────────────────────────────────
function TeamPicker({ selectedTeamIds, allTeams, onAdd, onRemove, onCreateNew, sport }) {
  const [teamSearch, setTeamSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const containerRef = useState(null);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    return allTeams.filter(t => {
      const notSelected = !selectedTeamIds.some(id => String(id) === String(t._id));
      const matchesSearch = !q || t.name.toLowerCase().includes(q) ||
        (t.shortName || "").toLowerCase().includes(q) ||
        (t.country || "").toLowerCase().includes(q);
      return notSelected && matchesSearch;
    });
  }, [allTeams, selectedTeamIds, teamSearch]);

  const selectedTeams = useMemo(() =>
    selectedTeamIds.map(id => allTeams.find(t => String(t._id) === String(id))).filter(Boolean),
    [allTeams, selectedTeamIds]
  );

  const handleSelect = (teamId) => {
    onAdd(teamId);
    setTeamSearch("");
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-2.5">

      {/* Selected team chips */}
      {selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTeams.map(team => (
            <div
              key={team._id}
              className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 dark:border-indigo-500/30 dark:bg-indigo-500/10"
            >
              {team.logo ? (
                <img src={team.logo} alt="" className="h-5 w-5 rounded-md object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-200 dark:bg-indigo-500/20">
                  <Shield size={10} className="text-indigo-500" />
                </div>
              )}
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                {team.shortName || team.name}
              </span>
              <span className={`rounded px-1 text-[9px] font-bold uppercase border ${SPORT_COLORS[team.sport] || SPORT_COLORS.other}`}>
                {team.sport}
              </span>
              <button
                type="button"
                onClick={() => onRemove(String(team._id))}
                className="ml-0.5 text-rose-400 hover:text-rose-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input — full width */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={teamSearch}
          onChange={e => { setTeamSearch(e.target.value); setDropdownOpen(true); }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          placeholder="Search teams by name, country..."
          className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
        />

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg">
            {/* Existing teams list */}
            <div className="max-h-44 overflow-y-auto">
              {filteredTeams.length === 0 && teamSearch.trim() ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">No teams match "{teamSearch}"</div>
              ) : filteredTeams.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">All teams already added, or no teams exist yet.</div>
              ) : (
                filteredTeams.map(team => (
                  <button
                    key={team._id}
                    type="button"
                    onMouseDown={() => handleSelect(String(team._id))}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    {team.logo ? (
                      <img src={team.logo} alt="" className="h-7 w-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Shield size={14} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{team.name}</p>
                      <p className="text-[10px] text-slate-400">{[team.shortName, team.country].filter(Boolean).join(" · ") || team.sport}</p>
                    </div>
                    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${SPORT_COLORS[team.sport] || SPORT_COLORS.other}`}>
                      {team.sport}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Divider + Create New Team — always visible */}
            <div className="border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onMouseDown={() => { setDropdownOpen(false); onCreateNew(); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                  <Plus size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                Create New Team
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty state hint when nothing selected and not focused */}
      {selectedTeams.length === 0 && !dropdownOpen && (
        <p className="text-xs text-slate-400 dark:text-slate-500 pl-1">
          Click the search box to pick from existing teams, or create a new one.
        </p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function Series() {
  const [seriesList, setSeriesList] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [allSports, setAllSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);

  const [allMatches, setAllMatches] = useState([]);
  const [tempMatch, setTempMatch] = useState("");
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [newMatchForm, setNewMatchForm] = useState(defaultNewMatch);
  const [newMatchError, setNewMatchError] = useState("");
  const [selectedMatches, setSelectedMatches] = useState([]);

  const loadSeries = async () => {
    try {
      setLoading(true);
      setError("");
      const [seriesRes, teamsRes, matchesRes, sportsRes] = await Promise.all([
        api.get("/admin/series", { params: { page: 1, limit: 200 } }),
        api.get("/admin/teams", { params: { limit: 1000 } }).catch(() => ({ data: { teams: [] } })),
        api.get("/admin/matches", { params: { limit: 1000 } }).catch(() => ({ data: { matches: [] } })),
        api.get("/admin/sports").catch(() => ({ data: { sports: [] } }))
      ]);
      setSeriesList(Array.isArray(seriesRes?.data?.series) ? seriesRes.data.series : []);
      setAllTeams(Array.isArray(teamsRes?.data?.teams) ? teamsRes.data.teams : []);
      setAllMatches(Array.isArray(matchesRes?.data?.matches) ? matchesRes.data.matches : []);
      setAllSports(Array.isArray(sportsRes?.data?.sports) ? sportsRes.data.sports : []);
    } catch (apiError) {
      setSeriesList([]);
      setError(apiError?.response?.data?.message || "Unable to load series.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSeries(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    total: seriesList.length,
    upcoming: seriesList.filter(i => i.status === "upcoming").length,
    live: seriesList.filter(i => i.status === "live").length,
    completed: seriesList.filter(i => i.status === "completed").length,
    featured: seriesList.filter(i => i.isFeatured).length,
    trending: seriesList.filter(i => i.isTrending).length,
    homeScreen: seriesList.filter(i => i.isHomeScreen).length,
  }), [seriesList]);

  const filteredSeries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return seriesList.filter(item => {
      const statusOk = statusFilter === "all" || (item.status || "").toLowerCase() === statusFilter;
      const sportOk = sportFilter === "all" || (item.sport || "").toLowerCase() === sportFilter;
      const text = [item.title, item.slug, item.sport, item.status, item.tourCountry]
        .filter(Boolean).join(" ").toLowerCase();
      return statusOk && sportOk && (!q || text.includes(q));
    });
  }, [seriesList, search, statusFilter, sportFilter]);

  const sports = useMemo(() => {
    return allSports;
  }, [allSports]);

  const teamMap = useMemo(() => {
    const map = new Map();
    allTeams.forEach(t => map.set(String(t._id), t));
    return map;
  }, [allTeams]);

  const matchMap = useMemo(() => {
    const map = new Map();
    allMatches.forEach(m => map.set(String(m._id), m));
    return map;
  }, [allMatches]);

  const getMatchObj = id => matchMap.get(String(id));

  const getSeriesMatchIds = (series) => {
    if (Array.isArray(series?.matchIds)) return series.matchIds.map(i => typeof i === "object" ? i._id : i);
    return allMatches
      .filter(m => String(m.seriesId?._id || m.seriesId || "") === String(series?._id || ""))
      .map(m => m._id);
  };

  const onFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: "" }));
  };

  const addTeam = (teamId) => {
    if (!teamId) return;
    setForm(prev => {
      if (prev.teams.some(id => String(id) === String(teamId))) return prev;
      return { ...prev, teams: [...prev.teams, teamId] };
    });
  };

  const removeTeam = (teamId) => {
    setForm(prev => ({ ...prev, teams: prev.teams.filter(id => String(id) !== String(teamId)) }));
  };

  const handleTeamCreated = (newTeam) => {
    setAllTeams(prev => [newTeam, ...prev]);
    addTeam(String(newTeam._id));
  };

  const addMatch = (matchId) => {
    if (!matchId) return;
    setForm(prev => {
      if (prev.matchIds.some(id => String(id) === String(matchId))) return prev;
      return { ...prev, matchIds: [...prev.matchIds, matchId] };
    });
  };

  const removeMatch = (matchId) => {
    setForm(prev => ({ ...prev, matchIds: prev.matchIds.filter(id => String(id) !== String(matchId)) }));
  };

  const onNewMatchChange = (key, value) => { setNewMatchForm(prev => ({ ...prev, [key]: value })); if (newMatchError) setNewMatchError(""); };
  const onNewMatchFileChange = (key, file) => setNewMatchForm(prev => ({ ...prev, [key]: file || null }));

  const onNewMatchScoreSourceChange = (index, key, value) => {
    setNewMatchForm(prev => ({
      ...prev,
      scoreSources: prev.scoreSources.map((s, i) => i === index ? { ...s, [key]: value } : s)
    }));
  };

  const addNewMatchScoreSource = () => setNewMatchForm(prev => ({ ...prev, scoreSources: [...prev.scoreSources, { ...emptyScoreSource }] }));
  const removeNewMatchScoreSource = (index) => setNewMatchForm(prev => ({ ...prev, scoreSources: prev.scoreSources.filter((_, i) => i !== index) }));

  const openNewMatchModal = () => {
    setNewMatchForm({ ...defaultNewMatch, sport: form.sport || "cricket", tournament: form.title || "" });
    setNewMatchError("");
    setShowNewMatchForm(true);
  };

  const createNewMatch = async () => {
    if (!newMatchForm.teamA.trim() || !newMatchForm.teamB.trim() || !newMatchForm.matchDate) {
      setNewMatchError("Team A, Team B, and match date are required."); return;
    }
    try {
      setCreatingMatch(true);
      setNewMatchError("");
      const payload = new FormData();
      const resolvedStatus = getStatusForMatchDate(newMatchForm.status, newMatchForm.matchDate);
      const scoreSources = newMatchForm.scoreSources
        .filter(s => s.provider?.trim() || s.url?.trim())
        .map(s => ({ ...s, priority: Number(s.priority) || 1, isActive: s.isActive !== false }));
      payload.append("title", newMatchForm.title || `${newMatchForm.teamA} vs ${newMatchForm.teamB}`);
      payload.append("sport", newMatchForm.sport || form.sport || "cricket");
      payload.append("teamA", newMatchForm.teamA);
      payload.append("teamB", newMatchForm.teamB);
      payload.append("tournament", newMatchForm.tournament || form.title || "");
      payload.append("venue", newMatchForm.venue || "");
      payload.append("matchDate", new Date(newMatchForm.matchDate).toISOString());
      payload.append("status", resolvedStatus);
      payload.append("description", newMatchForm.description || "");
      payload.append("isFeatured", String(Boolean(newMatchForm.isFeatured)));
      payload.append("isHomeScreen", String(Boolean(newMatchForm.isHomeScreen)));
      payload.append("scoreSources", JSON.stringify(scoreSources));
      if (newMatchForm.teamALogoFile) payload.append("teamALogo", newMatchForm.teamALogoFile);
      if (newMatchForm.teamBLogoFile) payload.append("teamBLogo", newMatchForm.teamBLogoFile);
      if (newMatchForm.thumbnailFile) payload.append("thumbnail", newMatchForm.thumbnailFile);
      if (newMatchForm.bannerFile) payload.append("banner", newMatchForm.bannerFile);
      if (editMode && form._id) payload.append("seriesId", form._id);
      const response = await api.post("/admin/matches/create", payload, { headers: { "Content-Type": "multipart/form-data" } });
      const created = response?.data?.match;
      if (!created?._id) { setNewMatchError("Match created, but API did not return details."); return; }
      setAllMatches(prev => [created, ...prev.filter(m => String(m._id) !== String(created._id))]);
      setForm(prev => ({
        ...prev,
        matchIds: prev.matchIds.some(id => String(id) === String(created._id))
          ? prev.matchIds : [...prev.matchIds, created._id]
      }));
      setShowNewMatchForm(false);
    } catch (apiError) {
      setNewMatchError(apiError?.response?.data?.message || "Unable to create match.");
    } finally {
      setCreatingMatch(false);
    }
  };

  const openCreate = () => {
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setTempMatch("");
    setShowNewMatchForm(false);
    setNewMatchError("");
    setModalOpen(true);
  };

  const openEdit = (series) => {
    setEditMode(true);
    setFormErrors({});
    const teamsIds = Array.isArray(series?.teams)
      ? series.teams.map(t => typeof t === "object" ? String(t._id) : String(t))
      : [];
    setForm({
      _id: series?._id || "",
      title: series?.title || "",
      sport: series?.sport || "cricket",
      description: series?.description || "",
      teams: teamsIds,
      tourCountry: series?.tourCountry || "",
      startDate: series?.startDate ? new Date(series.startDate).toISOString().split("T")[0] : "",
      endDate: series?.endDate ? new Date(series.endDate).toISOString().split("T")[0] : "",
      status: series?.status || "upcoming",
      isFeatured: Boolean(series?.isFeatured),
      isTrending: Boolean(series?.isTrending),
      isPremium: Boolean(series?.isPremium),
      isHomeScreen: Boolean(series?.isHomeScreen),
      imageFile: null,
      tournamentLogoFile: null,
      matchIds: getSeriesMatchIds(series)
    });
    setTempMatch("");
    setShowNewMatchForm(false);
    setNewMatchError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setForm(defaultForm);
    setFormErrors({});
    setTempMatch("");
    setShowNewMatchForm(false);
    setNewMatchError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title?.trim()) nextErrors.title = "Series title is required";
    if (!form.sport?.trim()) nextErrors.sport = "Sport is required";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSeries = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setError("");
      const payload = new FormData();
      payload.append("title", form.title || "");
      payload.append("sport", form.sport || "");
      payload.append("description", form.description || "");
      payload.append("tourCountry", form.tourCountry || "");
      form.teams.forEach(id => payload.append("teams", id));
      form.matchIds.forEach(id => payload.append("matchIds", id));
      if (editMode && form.matchIds.length === 0) payload.append("matchIds", "");
      if (form.startDate) payload.append("startDate", form.startDate);
      if (form.endDate) payload.append("endDate", form.endDate);
      payload.append("status", form.status || "upcoming");
      payload.append("isFeatured", String(Boolean(form.isFeatured)));
      payload.append("isTrending", String(Boolean(form.isTrending)));
      payload.append("isPremium", String(Boolean(form.isPremium)));
      payload.append("isHomeScreen", String(Boolean(form.isHomeScreen)));
      if (form.imageFile) payload.append("banner", form.imageFile);
      if (form.tournamentLogoFile) payload.append("tournamentLogo", form.tournamentLogoFile);

      let response;
      if (editMode && form._id) {
        response = await api.patch(`/admin/series/${form._id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        response = await api.post("/admin/series", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }
      const saved = response?.data?.series;
      if (saved?._id) {
        setSeriesList(prev => editMode ? prev.map(i => i._id === saved._id ? saved : i) : [saved, ...prev]);
      } else {
        await loadSeries();
      }
      closeModal();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to save series.");
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (series) => {
    if (!series?._id) { setSelectedSeries(series || null); setSelectedMatches([]); return; }
    try {
      const response = await api.get(`/admin/series/${series._id}`);
      setSelectedSeries(response?.data?.series || series);
      setSelectedMatches(response?.data?.matches || []);
    } catch {
      setSelectedSeries(series);
      setSelectedMatches([]);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      setError("");
      await api.delete(`/admin/series/${deleteTarget._id}`);
      setSeriesList(prev => prev.filter(i => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to delete series.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Series"
        subtitle="Manage sports series, tournaments, and leagues."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadSeries} className="admin-toolbar-btn">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <Plus size={15} /> Add Series
            </button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-rose-500">{error}</p> : null}

      {/* Filters */}
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr)]">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, sport..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none dark:bg-slate-900 dark:text-slate-100">
          <option value="all">Status: All</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sportFilter} onChange={e => setSportFilter(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none dark:bg-slate-900 dark:text-slate-100">
          <option value="all">Sport: All</option>
          {sports.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900 dark:text-slate-100" },
          { label: "Live", value: stats.live, color: "text-rose-500" },
          { label: "Upcoming", value: stats.upcoming, color: "text-blue-500" },
          { label: "Completed", value: stats.completed, color: "text-emerald-500" },
          { label: "Featured", value: stats.featured, color: "text-amber-500" },
          { label: "Trending", value: stats.trending, color: "text-emerald-500" },
          { label: "Home Screen", value: stats.homeScreen, color: "text-indigo-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading series...</div>
        ) : !filteredSeries.length ? (
          <div className="p-10 text-center text-sm text-slate-500">No series found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Series / Tournament</th>
                  <th className="px-4 py-3 font-medium">Teams / Sport</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSeries.map(series => (
                  <tr key={series._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {series.tournamentLogo || series.banner ? (
                            <img src={series.tournamentLogo || series.banner} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300"><Trophy size={16} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[250px]" title={series.title}>{series.title}</p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {series.isFeatured && <span className="text-[9px] font-bold text-amber-500 uppercase">Featured</span>}
                            {series.isTrending && <span className="text-[9px] font-bold text-emerald-500 uppercase">Trending</span>}
                            {series.isPremium && <span className="text-[9px] font-bold text-violet-500 uppercase">Premium</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 uppercase">{series.sport}</p>
                        {/* Show team logos/names if populated */}
                        {Array.isArray(series.teams) && series.teams.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {series.teams.slice(0, 3).map(t => {
                              const team = typeof t === "object" ? t : teamMap.get(String(t));
                              return team ? (
                                <div key={String(t._id || t)} className="flex items-center gap-1">
                                  {team.logo ? (
                                    <img src={team.logo} alt="" className="h-4 w-4 rounded object-cover" />
                                  ) : (
                                    <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
                                      <Shield size={8} className="text-slate-400" />
                                    </div>
                                  )}
                                  <span className="text-[10px] text-slate-500">{team.shortName || team.name}</span>
                                </div>
                              ) : null;
                            })}
                            {series.teams.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{series.teams.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400">No teams</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${getBadgeClass(series.status, STATUS_STYLES)}`}>
                        {series.status || "upcoming"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openView(series)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View"><Eye size={14} /></button>
                        <button onClick={() => openEdit(series)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setCommentTarget(series)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Comments"><MessageSquare size={14} /></button>
                        <button onClick={() => setDeleteTarget(series)} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{editMode ? "Edit Series" : "Create Series"}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill in series details, dates, logo, teams and matches.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
              </div>

              <form onSubmit={saveSeries} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">

                  {/* Title */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Series Title</span>
                    <input value={form.title} onChange={e => onFormChange("title", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                    {formErrors.title && <span className="mt-1 block text-xs text-rose-500">{formErrors.title}</span>}
                  </label>

                  {/* Sport */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                    <select value={form.sport} onChange={e => onFormChange("sport", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100">
                      {sports.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                    </select>
                    {formErrors.sport && <span className="mt-1 block text-xs text-rose-500">{formErrors.sport}</span>}
                  </label>

                  {/* Tour Country */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Tour Country</span>
                    <input value={form.tourCountry} onChange={e => onFormChange("tourCountry", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                  </label>

                  {/* Status */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                    <select value={form.status} onChange={e => onFormChange("status", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100">
                      <option value="upcoming">upcoming</option>
                      <option value="live">live</option>
                      <option value="completed">completed</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>

                  {/* Start Date */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Start Date</span>
                    <input type="date" value={form.startDate} onChange={e => onFormChange("startDate", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                  </label>

                  {/* End Date */}
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">End Date</span>
                    <input type="date" value={form.endDate} onChange={e => onFormChange("endDate", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                  </label>

                  {/* Toggles */}
                  <label className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <input type="checkbox" checked={form.isTrending} onChange={e => onFormChange("isTrending", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-500" />
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                      <Flame size={14} className="fill-current" /> Is Trending
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => onFormChange("isFeatured", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-500" />
                    <span className="text-slate-700 dark:text-slate-200">Is Featured</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <input type="checkbox" checked={form.isHomeScreen} onChange={e => onFormChange("isHomeScreen", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-500" />
                    <span className="text-slate-700 dark:text-slate-200">Is Home Screen</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm dark:border-violet-500/30 dark:bg-violet-500/10">
                    <input type="checkbox" checked={form.isPremium} onChange={e => onFormChange("isPremium", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-violet-600" />
                    <span className="text-violet-700 dark:text-violet-300">👑 Premium Content <span className="text-xs text-slate-400">(subscription required)</span></span>
                  </label>

                  {/* Banner */}
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Banner Image</span>
                    <input type="file" accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) { setError("Banner too large. Max 2MB."); e.target.value = ""; return; }
                        onFormChange("imageFile", file || null);
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  {/* Tournament Logo */}
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Tournament Logo</span>
                    <input type="file" accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) { setError("Logo too large. Max 2MB."); e.target.value = ""; return; }
                        onFormChange("tournamentLogoFile", file || null);
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100" />
                  </label>

                  {/* ── Teams Section ── */}
                  <div className="block text-sm md:col-span-2">
                    <div className="mb-2 flex items-center gap-2">
                      <Users size={15} className="text-indigo-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-200">Teams</span>
                      {form.teams.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                          {form.teams.length} selected
                        </span>
                      )}
                    </div>
                    <TeamPicker
                      selectedTeamIds={form.teams}
                      allTeams={allTeams}
                      onAdd={addTeam}
                      onRemove={removeTeam}
                      onCreateNew={() => setShowCreateTeamModal(true)}
                      sport={form.sport}
                    />
                  </div>

                  {/* ── Matches Section ── */}
                  <div className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Link Matches</span>
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),auto,auto]">
                      <select value={tempMatch} onChange={e => setTempMatch(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100">
                        <option value="">Select Match</option>
                        {allMatches.map(m => (
                          <option key={m._id} value={m._id}>
                            {m.teamA} vs {m.teamB} ({new Date(m.matchDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => { addMatch(tempMatch); setTempMatch(""); }}
                        className="flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                        Add
                      </button>
                      <button type="button" onClick={openNewMatchModal}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Plus size={14} /> New Match
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.matchIds.map(id => {
                        const m = getMatchObj(id);
                        return (
                          <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800">
                            <span className="text-slate-700 dark:text-slate-200">{m ? `${m.teamA} vs ${m.teamB}` : "Match"}</span>
                            <button type="button" onClick={() => removeMatch(id)} className="text-rose-500 hover:text-rose-600"><X size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                    <textarea rows="3" value={form.description} onChange={e => onFormChange("description", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100" />
                  </label>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="admin-secondary-btn">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? "Saving..." : editMode ? "Save Changes" : "Create Series"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create New Match Modal ── */}
      <AnimatePresence>
        {showNewMatchForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create New Match</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create a match and add it to this series.</p>
                </div>
                <button type="button" onClick={() => setShowNewMatchForm(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Match Title</span>
                  <input value={newMatchForm.title} onChange={e => onNewMatchChange("title", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Sport</span>
                  <select value={newMatchForm.sport} onChange={e => onNewMatchChange("sport", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                    {sports.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Team A</span>
                  <input value={newMatchForm.teamA} onChange={e => onNewMatchChange("teamA", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Team B</span>
                  <input value={newMatchForm.teamB} onChange={e => onNewMatchChange("teamB", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Tournament</span>
                  <input value={newMatchForm.tournament} onChange={e => onNewMatchChange("tournament", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Venue</span>
                  <input value={newMatchForm.venue} onChange={e => onNewMatchChange("venue", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Match Date & Time</span>
                  <input type="datetime-local" value={newMatchForm.matchDate} onChange={e => onNewMatchChange("matchDate", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Status</span>
                  <select value={newMatchForm.status} onChange={e => onNewMatchChange("status", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                    <option value="upcoming">upcoming</option>
                    <option value="live">live</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  {getStatusForMatchDate(newMatchForm.status, newMatchForm.matchDate) !== newMatchForm.status && (
                    <span className="mt-1 block text-xs text-amber-600 dark:text-amber-300">Past upcoming match will be saved as completed.</span>
                  )}
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <input type="checkbox" checked={newMatchForm.isFeatured} onChange={e => onNewMatchChange("isFeatured", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-500" />
                  <span className="text-slate-700 dark:text-slate-200">Is Featured</span>
                </label>

                {["teamALogoFile", "teamBLogoFile", "thumbnailFile", "bannerFile"].map((key) => (
                  <label key={key} className="block text-sm">
                    <span className="mb-1 block text-slate-500 dark:text-slate-400">
                      {key === "teamALogoFile" ? "Team A Logo" : key === "teamBLogoFile" ? "Team B Logo" : key === "thumbnailFile" ? "Thumbnail" : "Banner"}
                    </span>
                    <input type="file" accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 2 * 1024 * 1024) { setNewMatchError(`${key} is too large. Max 2MB.`); e.target.value = ""; return; }
                        onNewMatchFileChange(key, file || null);
                      }}
                      className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:text-slate-100" />
                  </label>
                ))}

                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Score Sources</span>
                    <button type="button" onClick={addNewMatchScoreSource} className="admin-action-btn-sm">
                      <Plus size={14} /> Add Source
                    </button>
                  </div>
                  {newMatchForm.scoreSources.length ? (
                    <div className="space-y-3">
                      {newMatchForm.scoreSources.map((source, index) => (
                        <div key={index} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Source {index + 1}</p>
                            <button type="button" onClick={() => removeNewMatchScoreSource(index)} className="admin-action-btn-danger-square"><Trash2 size={14} /></button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <input value={source.provider} onChange={e => onNewMatchScoreSourceChange(index, "provider", e.target.value)} placeholder="Provider"
                              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                            <select value={source.category} onChange={e => onNewMatchScoreSourceChange(index, "category", e.target.value)}
                              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100">
                              {scoreSourceCategories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                            </select>
                            <input value={source.url} onChange={e => onNewMatchScoreSourceChange(index, "url", e.target.value)} placeholder="URL"
                              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 md:col-span-2" />
                            <input value={source.apiKey} onChange={e => onNewMatchScoreSourceChange(index, "apiKey", e.target.value)} placeholder="API Key"
                              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                            <input type="number" min="1" value={source.priority} onChange={e => onNewMatchScoreSourceChange(index, "priority", e.target.value)} placeholder="Priority"
                              className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <input type="checkbox" checked={source.isActive !== false} onChange={e => onNewMatchScoreSourceChange(index, "isActive", e.target.checked)} className="h-4 w-4 rounded" />
                              Active source
                            </label>
                            <textarea rows="2" value={source.notes} onChange={e => onNewMatchScoreSourceChange(index, "notes", e.target.value)} placeholder="Notes"
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100 md:col-span-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">No score source configured.</div>
                  )}
                </div>

                <label className="block text-sm md:col-span-2">
                  <span className="mb-1 block text-slate-500 dark:text-slate-400">Description</span>
                  <textarea rows="3" value={newMatchForm.description} onChange={e => onNewMatchChange("description", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-400 dark:bg-slate-950 dark:text-slate-100" />
                </label>
              </div>

              {newMatchError && <p className="mt-3 text-sm text-rose-500">{newMatchError}</p>}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewMatchForm(false)} className="admin-secondary-btn">Cancel</button>
                <button type="button" onClick={createNewMatch} disabled={creatingMatch}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
                  {creatingMatch ? "Creating..." : "Create & Add Match"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── View Modal ── */}
      <AnimatePresence>
        {selectedSeries && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
              <div className="flex h-full flex-col">
                {/* Banner */}
                <div className="relative h-64 w-full shrink-0">
                  {selectedSeries.banner ? (
                    <img src={selectedSeries.banner} alt={selectedSeries.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800">
                      <Film size={48} className="text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  <button type="button" onClick={() => setSelectedSeries(null)}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40"><X size={20} /></button>
                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getBadgeClass(selectedSeries.status, STATUS_STYLES)}`}>
                            {selectedSeries.status || "upcoming"}
                          </span>
                          {selectedSeries.isFeatured && <span className="flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white"><Star size={10} className="fill-current" /> Featured</span>}
                          {selectedSeries.isTrending && <span className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white"><Flame size={10} className="fill-current" /> Trending</span>}
                          {selectedSeries.isHomeScreen && <span className="flex items-center gap-1 rounded-lg bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white"><Home size={10} className="fill-current" /> Home</span>}
                          {selectedSeries.isPremium && <span className="flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">👑 Premium</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          {selectedSeries.tournamentLogo && (
                            <img src={selectedSeries.tournamentLogo} alt="" className="h-12 w-12 rounded-xl border border-white/20 bg-white/10 object-contain p-1" />
                          )}
                          <h2 className="text-3xl font-bold text-white">{selectedSeries.title || "Untitled"}</h2>
                        </div>
                        <p className="mt-1 flex items-center gap-2 text-slate-300">
                          <Trophy size={14} className="text-indigo-400" />
                          <span className="text-sm font-medium">{(selectedSeries.sport || "Other").toUpperCase()}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-600" />
                          <span className="text-sm text-slate-400">{selectedSeries.tourCountry || "Global"}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid overflow-hidden lg:grid-cols-[1fr,400px]">
                  <div className="overflow-y-auto p-8 max-h-[calc(90vh-256px)]">
                    <div className="space-y-8">
                      {/* Dates */}
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400"><Calendar size={18} /></div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Timeline</p>
                            <p className="mt-1 text-sm text-slate-200">
                              {selectedSeries.startDate ? new Date(selectedSeries.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                              <span className="mx-2 text-slate-600">—</span>
                              {selectedSeries.endDate ? new Date(selectedSeries.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><MapPin size={18} /></div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Country</p>
                            <p className="mt-1 text-sm text-slate-200">{selectedSeries.tourCountry || "To be announced"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Info size={16} className="text-slate-400" />
                          <h4 className="text-sm font-semibold text-slate-200">About the Series</h4>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-400">{selectedSeries.description || "No description available."}</p>
                      </div>

                      {/* Teams */}
                      <div>
                        <div className="mb-4 flex items-center gap-2">
                          <Users size={16} className="text-slate-400" />
                          <h4 className="text-sm font-semibold text-slate-200">Participating Teams</h4>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                            {selectedSeries.teams?.length || 0}
                          </span>
                        </div>
                        {selectedSeries.teams?.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedSeries.teams.map(team => {
                              const t = typeof team === "object" ? team : teamMap.get(String(team));
                              if (!t) return null;
                              return (
                                <div key={String(t._id || team)} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                                  {t.logo ? (
                                    <img src={t.logo} alt={t.name} className="h-10 w-10 rounded-xl object-cover border border-white/10" />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                                      <Shield size={18} className="text-slate-500" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-200 truncate">{t.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {t.shortName && <span className="text-[10px] text-slate-500 uppercase">{t.shortName}</span>}
                                      {t.country && <span className="text-[10px] text-slate-600">· {t.country}</span>}
                                    </div>
                                  </div>
                                  <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${SPORT_COLORS[t.sport] || SPORT_COLORS.other}`}>
                                    {t.sport}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-600">
                            <Shield size={14} /> No teams assigned to this series.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matches */}
                  <div className="border-l border-white/5 bg-slate-950/30 p-8 overflow-y-auto max-h-[calc(90vh-256px)]">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-400" />
                        <h4 className="text-base font-semibold text-white">Schedule</h4>
                      </div>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">{selectedMatches.length} Matches</span>
                    </div>
                    <div className="space-y-4">
                      {selectedMatches.length > 0 ? selectedMatches.map(match => (
                        <div key={match._id} className="overflow-hidden rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${getBadgeClass(match.status, STATUS_STYLES)}`}>{match.status}</span>
                            <span className="text-[10px] text-slate-500">{new Date(match.matchDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="flex-1 text-right text-xs font-bold text-slate-200 line-clamp-1">{match.teamA}</p>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-500">VS</div>
                            <p className="flex-1 text-left text-xs font-bold text-slate-200 line-clamp-1">{match.teamB}</p>
                          </div>
                          {match.title && <p className="mt-2 text-center text-[10px] text-slate-500 italic line-clamp-1">{match.title}</p>}
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-600"><Trophy size={24} /></div>
                          <p className="text-sm font-medium text-slate-400">No matches found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Team Modal ── */}
      <CreateTeamModal
        open={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onCreated={handleTeamCreated}
        defaultSport={form.sport}
        allSports={allSports}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this series?"
        message={`This will permanently remove ${deleteTarget?.title || "this series"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete Series"}
      />
      <CommentModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        itemId={commentTarget?._id}
        itemName={commentTarget?.title}
      />
    </div>
  );
}

export default Series;
