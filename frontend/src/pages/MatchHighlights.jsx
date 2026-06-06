import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Clock, Edit2, Film, Link, Play,
  Plus, RefreshCw, Search, Tag, Trash2, Upload, Video, X, MessageSquare, Eye
} from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import CommentModal from "../components/CommentModal";



const cx = (...p) => p.filter(Boolean).join(" ");

const formatSecondsToTime = (totalSeconds) => {
  if (!totalSeconds) return "00:00";
  const s = Number(totalSeconds);
  if (isNaN(s)) return "00:00";
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  if (hrs > 0) return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatTimeToSeconds = (timeStr) => {
  if (!timeStr || !String(timeStr).includes(":")) return 0;
  const parts = String(timeStr).split(":").map(Number);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const CAT_LABELS = { full_match: "Full Match", batting: "Batting", bowling: "Bowling", fielding: "Fielding", goal: "Goal", save: "Save", other: "Other" };
const CAT_COLORS = {
  full_match: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  batting: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  bowling: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  fielding: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  goal: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  save: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  other: "bg-slate-500/15 text-slate-400 border-slate-500/30"
};

const TEAM_SPORTS = ["cricket", "football", "basketball", "kabaddi", "tennis", "volleyball", "other"];

const EMPTY_FORM = { title: "", description: "", category: "other", sourceType: "url", videoUrl: "", duration: "00:00", tags: "", isPremium: false, isFeatured: false, order: 0, matchId: "", seriesId: "", teamA: "", teamB: "", liveLogo: "", showLiveLogo: false };


function Badge({ category }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", CAT_COLORS[category] || CAT_COLORS.other)}>
      <Tag size={9} />{CAT_LABELS[category] || category}
    </span>
  );
}

function SeriesMatchesModal({ open, onClose, series, matches, onSelectMatch }) {
  if (!open || !series) return null;
  const seriesMatches = matches.filter(m => (m.seriesId?._id || m.seriesId) === series._id);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
          className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden flex flex-col max-h-[80vh]"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Matches in Series</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{series.title}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={16} /></button>
          </div>
          <div className="overflow-y-auto p-4 space-y-2">
            {seriesMatches.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No matches found for this series.</p>
            ) : (
              seriesMatches.map(m => (
                <button key={m._id} onClick={() => { onSelectMatch(m._id); onClose(); }}
                  className="w-full flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-indigo-300 hover:bg-white transition dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900">
                  {m.thumbnail && <img src={m.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{m.title || `${m.teamA} vs ${m.teamB}`}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{m.status} • {new Date(m.matchDate).toLocaleDateString()}</p>
                  </div>
                  <ChevronDown size={14} className="-rotate-90 text-slate-400" />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PlayModal({ hl, onClose }) {

  if (!hl) return null;
  const isYT = hl.videoUrl?.includes("youtube.com") || hl.videoUrl?.includes("youtu.be");
  const embedSrc = isYT ? hl.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/") : null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl rounded-2xl bg-slate-950 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-semibold text-white truncate">{hl.title}</h3>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge category={hl.category} />
                {hl.duration && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{hl.duration}</span>}
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20"><X size={16} /></button>
          </div>
          <div className="relative aspect-video bg-black">
            {isYT ? (
              <iframe src={embedSrc} title={hl.title} className="h-full w-full" frameBorder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen />
            ) : (
              <video src={hl.videoUrl} className="h-full w-full object-contain" controls autoPlay />
            )}
            {hl.showLiveLogo && hl.liveLogo && (
              <div className="pointer-events-none absolute right-4 top-4 z-50">
                <img
                  src={hl.liveLogo}
                  alt="Live Logo"
                  className="max-h-12 w-auto object-contain drop-shadow-lg"
                />
              </div>
            )}
          </div>
          {hl.description && (
            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-sm text-slate-300">{hl.description}</p>
              {hl.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {hl.tags.map(t => <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">#{t}</span>)}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const normalizeTeamSport = (sport) => TEAM_SPORTS.includes(String(sport || "").toLowerCase())
  ? String(sport).toLowerCase()
  : "other";

function CreateTeamModal({ open, onClose, onCreateTeam, defaultSport = "cricket" }) {
  const initialSport = normalizeTeamSport(defaultSport);
  const [form, setForm] = useState({
    name: "", shortName: "", sport: initialSport, country: "",
    logo: "", logoFile: null, logoPreview: "",
    slug: "", sortOrder: "0", isActive: true
  });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        name: "", shortName: "", sport: normalizeTeamSport(defaultSport), country: "",
        logo: "", logoFile: null, logoPreview: "",
        slug: "", sortOrder: "0", isActive: true
      });
      setCreateErr("");
    }
  }, [open, defaultSport]);

  if (!open) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fieldCls = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  const lbl = "mb-1 block text-sm text-slate-500 dark:text-slate-400";

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (!form.name.trim()) return setCreateErr("Team name is required");
    if (!form.sport) return setCreateErr("Sport is required");
    setCreating(true); setCreateErr("");
    try {
      await onCreateTeam(form);
      onClose();
    } catch (err) {
      setCreateErr(err?.response?.data?.message || "Failed to create team");
    } finally { setCreating(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 pretty-scroll"
          onClick={e => e.stopPropagation()}>

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Team</h2>
              <p className="mt-1 text-sm text-slate-500">Fill in team details — name, sport, country and logo URL.</p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
              <X size={18} />
            </button>
          </div>

          {createErr && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">{createErr}</div>}

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className={lbl}>Team Name *</span>
                <input value={form.name} onChange={e => set("name", e.target.value)} className={fieldCls} placeholder="e.g. Mumbai Indians" />
              </label>

              <label className="block text-sm">
                <span className={lbl}>Short Name</span>
                <input value={form.shortName} onChange={e => set("shortName", e.target.value)} className={fieldCls} placeholder="e.g. MI" maxLength={10} />
              </label>

              <label className="block text-sm">
                <span className={lbl}>Sport *</span>
                <select value={form.sport} onChange={e => set("sport", e.target.value)} className={fieldCls}>
                  {TEAM_SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport.charAt(0).toUpperCase() + sport.slice(1)}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className={lbl}>Country</span>
                <input value={form.country} onChange={e => set("country", e.target.value)} className={fieldCls} placeholder="e.g. India" />
              </label>

              <label className="block text-sm md:col-span-2">
                <span className={lbl}>Logo</span>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input value={form.logo} onChange={e => {
                      set("logo", e.target.value);
                      if (e.target.value) set("logoPreview", e.target.value);
                      if (!e.target.value && !form.logoFile) set("logoPreview", "");
                    }} className={fieldCls} placeholder="Logo URL (e.g. https://...)" disabled={!!form.logoFile} />
                  </div>
                  <span className="text-sm font-medium text-slate-400">OR</span>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          setCreateErr("Logo image is too large. Max 2MB allowed.");
                          e.target.value = "";
                          return;
                        }
                        setForm(p => ({ ...p, logoFile: file, logo: "", logoPreview: URL.createObjectURL(file) }));
                      }
                    }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                      <Upload size={16} /> Upload from local device
                    </div>
                  </div>
                </div>
                {form.logoPreview && (
                  <div className="mt-3 relative inline-block">
                    <img src={form.logoPreview} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                    <button type="button" onClick={() => setForm(p => ({ ...p, logoFile: null, logo: "", logoPreview: "" }))}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 shadow-sm">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </label>

              <label className="block text-sm">
                <span className={lbl}>Slug</span>
                <input value={form.slug} onChange={e => set("slug", e.target.value)} className={fieldCls} placeholder="auto-generated if empty" />
              </label>

              <label className="block text-sm">
                <span className={lbl}>Sort Order</span>
                <input type="number" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)} className={fieldCls} />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                <span className="text-slate-700 dark:text-slate-200">Team is active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="admin-secondary-btn">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={creating || !form.name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-50">
                <Plus size={14} />{creating ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TeamPicker({ label, value, onChange, allTeams, inputCls, labelCls, onCreateTeam, defaultSport, initialTeam, loading }) {
  const [searchQ, setSearchQ] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const sport = normalizeTeamSport(defaultSport);

  const filtered = allTeams.filter(t =>
    (!defaultSport || sport === "other" || t.sport === sport) &&
    (!searchQ.trim() || t.name.toLowerCase().includes(searchQ.toLowerCase()))
  );

  // Fallback: if filtered is empty but allTeams has data (and no search), show all
  const displayTeams = (filtered.length === 0 && !searchQ.trim() && allTeams.length > 0) ? allTeams : filtered;

  const selectedTeam = value
    ? (allTeams.find(t => t._id === value) || (initialTeam?._id === value ? initialTeam : null))
    : null;
  const handleCreateTeam = async (teamData) => {
    const createdTeam = await onCreateTeam(teamData);
    if (createdTeam?._id) {
      onChange(createdTeam._id);
    }
    return createdTeam;
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>

      {/* Selected team chip */}
      {selectedTeam && (
        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 border border-indigo-200 dark:border-indigo-500/20">
          {selectedTeam.logo && <img src={selectedTeam.logo} alt="" className="h-6 w-6 rounded-lg object-cover" />}
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex-1 truncate">{selectedTeam.name}</span>
          <button type="button" onClick={() => onChange("")} className="text-indigo-400 hover:text-rose-500 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input className={cx(inputCls, "!pl-9 !h-9 !text-xs")} placeholder="Search teams..." value={searchQ}
          onChange={e => setSearchQ(e.target.value)} />
      </div>

      {/* Team list */}
      <div className="max-h-28 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 pretty-scroll">
        {loading ? (
          <p className="py-4 text-center text-xs text-slate-400 animate-pulse">Loading teams...</p>
        ) : displayTeams.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">No teams found</p>
        ) : displayTeams.slice(0, 50).map(t => (
          <button type="button" key={t._id} onClick={() => { onChange(t._id); setSearchQ(""); }}
            className={cx("w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition",
              value === t._id && "bg-indigo-50 dark:bg-indigo-500/10")}>
            {t.logo ? <img src={t.logo} alt="" className="h-6 w-6 rounded-lg object-cover flex-shrink-0" /> : <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />}
            <span className="font-medium text-slate-700 dark:text-slate-200 truncate flex-1">{t.name}</span>
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{t.sport}</span>
          </button>
        ))}
      </div>

      {/* Create new button */}
      <button type="button" onClick={() => setShowCreateModal(true)}
        className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-2 text-[11px] font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 transition">
        <Plus size={12} /> Create New Team
      </button>

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTeam={handleCreateTeam}
        defaultSport={sport}
        inputCls={inputCls}
      />
    </div>
  );
}


function HlModal({ open, onClose, matchId, seriesId, selectedSeries, highlight, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [liveLogoFile, setLiveLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const videoRef = useRef();
  const thumbRef = useRef();
  const liveLogoRef = useRef();
  const [allTeams, setAllTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingTeams(true);
      api.get("/admin/teams", { params: { limit: 1000 } })
        .then(r => setAllTeams(Array.isArray(r?.data?.teams) ? r.data.teams : []))
        .catch(() => { })
        .finally(() => setLoadingTeams(false));
    }
  }, [open]);

  useEffect(() => {
    if (highlight) {
      setForm({
        title: highlight.title || "",
        description: highlight.description || "",
        category: highlight.category || "other",
        sourceType: highlight.sourceType || "url",
        videoUrl: highlight.videoUrl || "",
        duration: formatSecondsToTime(highlight.duration),
        tags: Array.isArray(highlight.tags) ? highlight.tags.join(", ") : "",
        isPremium: !!highlight.isPremium,
        isFeatured: !!highlight.isFeatured,
        order: highlight.order ?? 0,
        matchId: highlight.matchId?._id || highlight.matchId || "",
        seriesId: highlight.seriesId?._id || highlight.seriesId || "",
        teamA: highlight.teamA?._id || highlight.teamA || "",
        teamB: highlight.teamB?._id || highlight.teamB || "",
        liveLogo: highlight.liveLogo || "",
        showLiveLogo: !!highlight.showLiveLogo
      });
    } else {
      setForm({ ...EMPTY_FORM, matchId: matchId || "", seriesId: seriesId || "" });
    }

    setThumbFile(null); setVideoFile(null); setLiveLogoFile(null); setErr("");
  }, [highlight, open, matchId, seriesId]);

  const handleCreateTeam = async (teamData) => {
    const fd = new FormData();
    fd.append("name", teamData.name.trim());
    fd.append("sport", teamData.sport);
    if (teamData.shortName) fd.append("shortName", teamData.shortName.trim());
    if (teamData.country) fd.append("country", teamData.country.trim());
    if (teamData.slug) fd.append("slug", teamData.slug.trim());
    fd.append("sortOrder", String(Number(teamData.sortOrder || 0)));
    fd.append("isActive", String(Boolean(teamData.isActive)));
    if (teamData.logoFile) {
      fd.append("logoFile", teamData.logoFile);
    } else if (teamData.logo) {
      fd.append("logo", teamData.logo.trim());
    }
    const res = await api.post("/admin/teams", fd, { headers: { "Content-Type": "multipart/form-data" } });
    const newTeam = res?.data?.team;
    if (newTeam?._id) {
      setAllTeams(prev => [newTeam, ...prev]);
    }
    return newTeam;
  };

  if (!open) return null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setErr("Title is required");
    if (form.sourceType === "url" && !form.videoUrl.trim()) return setErr("Video URL is required");
    if (form.sourceType === "upload" && !videoFile && !highlight) return setErr("Video file is required");

    setSaving(true); setErr("");
    try {
      const fd = new FormData();
      const skipIfEmpty = ["matchId", "seriesId", "teamA", "teamB"];
      Object.entries(form).forEach(([k, v]) => {
        let val = v;
        if (k === "duration") val = formatTimeToSeconds(v);
        // Don't send empty ObjectId fields — backend treats "" as truthy and tries findById("")
        if (skipIfEmpty.includes(k) && !val) return;
        if (val !== null && val !== undefined) fd.append(k, val);
      });
      if (thumbFile) fd.append("thumbnail", thumbFile);
      if (videoFile) fd.append("videoFile", videoFile);
      if (liveLogoFile) {
        fd.append("liveLogo", liveLogoFile);
      } else {
        fd.append("liveLogo", form.liveLogo || "");
      }


      if (highlight) {
        await api.patch(`/admin/highlights/${highlight._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/admin/highlights", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      onSaved();
      onClose();
    } catch (er) {
      console.error("Highlight save error:", er);
      setErr(er?.response?.data?.message || er?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const labelCls = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
          className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">{highlight ? "Edit Highlight" : "Add Highlight"}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1 pretty-scroll">
            {err && <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">{err}</div>}

            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Rohit's Century" />
            </div>

            {/* Team A & Team B pickers (shown for series highlights) */}
            {(seriesId || form.seriesId) && (
              <div className="grid grid-cols-2 gap-4">
                <TeamPicker label="Team A" value={form.teamA} onChange={v => set("teamA", v)}
                  allTeams={allTeams} inputCls={inputCls} labelCls={labelCls} onCreateTeam={handleCreateTeam}
                  defaultSport={selectedSeries?.sport} initialTeam={highlight?.teamA} loading={loadingTeams} />
                <TeamPicker label="Team B" value={form.teamB} onChange={v => set("teamB", v)}
                  allTeams={allTeams} inputCls={inputCls} labelCls={labelCls} onCreateTeam={handleCreateTeam}
                  defaultSport={selectedSeries?.sport} initialTeam={highlight?.teamB} loading={loadingTeams} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={form.category} onChange={e => set("category", e.target.value)}>
                  {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Duration (HH:MM:SS)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.duration}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9:]/g, "");
                    if ((val.length === 2 || val.length === 5) && !val.endsWith(":")) {
                      if (e.nativeEvent.inputType !== "deleteContentBackward") val += ":";
                    }
                    if (val.length > 8) val = val.slice(0, 8);
                    set("duration", val);
                  }}
                  placeholder="01:30:00"
                />
              </div>
            </div>


            {/* Source type toggle */}
            <div>
              <label className={labelCls}>Video Source</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {["url", "upload"].map(t => (
                  <button type="button" key={t} onClick={() => set("sourceType", t)}
                    className={cx("flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition",
                      form.sourceType === t ? "bg-indigo-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400")}>
                    {t === "url" ? <Link size={14} /> : <Upload size={14} />}
                    {t === "url" ? "Paste URL" : "Upload File"}
                  </button>
                ))}
              </div>
            </div>

            {form.sourceType === "url" ? (
              <div>
                <label className={labelCls}>Video URL (YouTube, MP4, HLS, etc.)</label>
                <input className={inputCls} value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://..." />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Video File {highlight ? "(leave empty to keep existing)" : "*"}</label>
                <div onClick={() => videoRef.current?.click()}
                  className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                  <Video size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{videoFile ? videoFile.name : "Click to select video"}</span>
                </div>
                <input ref={videoRef} type="file" accept="video/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file && file.size > 500 * 1024 * 1024) {
                      setErr("Video file is too large. Max 500MB allowed.");
                      setVideoFile(null);
                      e.target.value = "";
                    } else {
                      setVideoFile(file || null);
                      setErr("");
                    }
                  }}
                />

              </div>
            )}

            <div>
              <label className={labelCls}>Thumbnail Image (optional)</label>
              <div onClick={() => thumbRef.current?.click()}
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                <Film size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{thumbFile ? thumbFile.name : "Click to select image"}</span>
              </div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file && file.size > 2 * 1024 * 1024) {
                    setErr("Thumbnail image is too large. Max 2MB allowed.");
                    setThumbFile(null);
                    e.target.value = "";
                  } else {
                    setThumbFile(file || null);
                    setErr("");
                  }
                }}
              />

            </div>

            <div>
              <label className={labelCls}>Live Logo (optional)</label>
              <div onClick={() => liveLogoRef.current?.click()}
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                <Film size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{liveLogoFile ? liveLogoFile.name : (form.liveLogo ? "Change live logo" : "Click to select image")}</span>
              </div>
              <input ref={liveLogoRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file && file.size > 2 * 1024 * 1024) {
                    setErr("Live logo image is too large. Max 2MB allowed.");
                    setLiveLogoFile(null);
                    e.target.value = "";
                  } else {
                    setLiveLogoFile(file || null);
                    setErr("");
                  }
                }}
              />
              {(liveLogoFile || form.liveLogo) && (
                <div className="mt-2 relative inline-block">
                  <img src={liveLogoFile ? URL.createObjectURL(liveLogoFile) : form.liveLogo} alt="Live Logo Preview" className="h-16 w-16 rounded-xl object-contain border border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => { setLiveLogoFile(null); setForm(p => ({ ...p, liveLogo: "" })); }}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 shadow-sm">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea className={cx(inputCls, "h-20 py-2 resize-none")} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional description..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tags (comma separated)</label>
                <input className={inputCls} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="six, century, wicket" />
              </div>
              <div>
                <label className={labelCls}>Display Order</label>
                <input type="number" className={inputCls} value={form.order} onChange={e => set("order", e.target.value)} min="0" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPremium} onChange={e => set("isPremium", e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Premium only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => set("isFeatured", e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.showLiveLogo} onChange={e => set("showLiveLogo", e.target.checked)} className="rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Show Live Logo</span>
              </label>
            </div>

          </form>

          <div className="flex gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-violet-600 transition disabled:opacity-60">
              {saving ? "Saving..." : highlight ? "Update" : "Create"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MatchHighlights() {
  const [matches, setMatches] = useState([]);
  const [series, setSeries] = useState([]);
  const [viewType, setViewType] = useState("match"); // "match" or "series"
  const [selectedId, setSelectedId] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingHl, setLoadingHl] = useState(false);
  const [activeHl, setActiveHl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [seriesMatchesOpen, setSeriesMatchesOpen] = useState(false);
  const [editHl, setEditHl] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);
  const [error, setError] = useState("");
  const [, setPagination] =
    useState({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1
    });




  const loadData = async () => {
    try {
      setLoadingItems(true);
      const [mRes, sRes] = await Promise.all([
        api.get("/admin/matches", { params: { limit: "all" } }),
        api.get("/admin/series", { params: { limit: "all" } })
      ]);
      const mList = mRes?.data?.matches || [];
      const sList = sRes?.data?.series || [];
      setMatches(mList);
      setSeries(sList);

      if (mList.length && !selectedId) {
        setSelectedId(mList[0]._id);
      } else if (sList.length && !selectedId) {
        setViewType("series");
        setSelectedId(sList[0]._id);
      }
    } catch { setError("Could not load matches or series."); }
    finally { setLoadingItems(false); }
  };



  const loadHighlights = async (id, type = viewType) => {
    if (!id) return;
    setLoadingHl(true); setError("");
    try {
      const params = type === "match" ? { matchId: id } : { seriesId: id };
      params.limit = 100; // Get more for the dashboard view
      const res = await api.get("/admin/highlights", { params });
      setHighlights(res?.data?.highlights || []);
      setPagination({
        total: res?.data?.total || 0,
        page: res?.data?.page || 1,
        limit: res?.data?.limit || 20
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load highlights");
      setHighlights([]);
    } finally { setLoadingHl(false); }
  };


  const handleViewTypeChange = (type) => {
    setViewType(type);
    if (type === "match" && matches.length) setSelectedId(matches[0]._id);
    else if (type === "series" && series.length) setSelectedId(series[0]._id);
    else setSelectedId("");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedId) loadHighlights(selectedId); }, [selectedId, viewType]);


  const selectedItem = viewType === "match"
    ? matches.find(m => m._id === selectedId)
    : series.find(s => s._id === selectedId);


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this highlight?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/highlights/${id}`);
      setHighlights(prev => prev.filter(h => h._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    } finally { setDeleting(null); }
  };

  const openAdd = () => { setEditHl(null); setModalOpen(true); };
  const openEdit = (hl) => { setEditHl(hl); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Highlights Management"
        subtitle="Manage video highlights for matches or entire series/tournaments."
        action={
          <div className="flex gap-2">
            <button onClick={() => loadHighlights(selectedId)} disabled={!selectedId || loadingHl}
              className="admin-toolbar-btn">
              <RefreshCw size={14} className={loadingHl ? "animate-spin" : ""} />Refresh
            </button>
            <button onClick={openAdd} disabled={!selectedId}
              className="admin-toolbar-btn bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50">
              <Plus size={14} />Add Highlight
            </button>
          </div>
        }
      />


      {/* Match Selector */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Film size={16} className="text-indigo-400" />Content Source
          </h2>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => handleViewTypeChange("match")}
              className={cx("px-4 py-1.5 text-xs font-medium rounded-lg transition", viewType === "match" ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              Match
            </button>
            <button onClick={() => handleViewTypeChange("series")}
              className={cx("px-4 py-1.5 text-xs font-medium rounded-lg transition", viewType === "series" ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              Series
            </button>
          </div>

        </div>

        {loadingItems ? (
          <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : (
          <div className="relative">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              <option value="">-- Choose {viewType} --</option>
              {viewType === "match" ? (
                matches.map(m => (
                  <option key={m._id} value={m._id}>{m.title || `${m.teamA} vs ${m.teamB}`} ({m.status})</option>
                ))
              ) : (
                series.map(s => (
                  <option key={s._id} value={s._id}>{s.title} ({s.sport})</option>
                ))
              )}

            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        )}

        {selectedItem && (
          <div className="mt-4 flex items-center gap-3">
            {selectedItem.thumbnail || selectedItem.image ? (
              <img src={selectedItem.thumbnail || selectedItem.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : null}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {viewType === "match"
                  ? (selectedItem.title || `${selectedItem.teamA} vs ${selectedItem.teamB}`)
                  : selectedItem.title}
              </p>
              <p className="text-xs text-slate-500">
                {selectedItem.sport?.toUpperCase()} • {selectedItem.tournament || selectedItem.tournamentName || "No Tournament"}

                {viewType === "match" && (
                  <> • <span className={cx(selectedItem.status === "live" && "text-rose-500", selectedItem.status === "upcoming" && "text-blue-500", selectedItem.status === "completed" && "text-emerald-500")}>
                    {selectedItem.status}
                  </span></>
                )}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {viewType === "series" && (
                <button onClick={() => setSeriesMatchesOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition">
                  <Film size={12} /> View Matches
                </button>
              )}
              <span className="text-sm font-semibold text-indigo-500">{highlights.length} clips</span>
            </div>

          </div>
        )}
      </motion.section>


      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <X size={16} />{error}
        </div>
      )}

      {/* Content */}
      {loadingHl && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {!loadingHl && selectedId && !error && highlights.length === 0 && (

        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm dark:bg-slate-900 text-center">
          <Video size={44} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-medium text-slate-600 dark:text-slate-300">No highlights yet</p>
          <p className="mt-1 text-sm text-slate-400">Click "Add Highlight" to create the first clip.</p>
          <button onClick={openAdd} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition">
            <Plus size={14} />Add Highlight
          </button>
        </div>
      )}

      {!loadingHl && highlights.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-100/70 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Highlight</th>
                  <th className="px-4 py-3 font-medium">Category / Duration</th>
                  <th className="px-4 py-3 font-medium">Stats</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {highlights.map((hl) => (
                  <tr key={hl._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 group">
                          {hl.thumbnail ? (
                            <img src={hl.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300"><Video size={14} /></div>
                          )}
                          <button onClick={() => setActiveHl(hl)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                            <Play size={12} className="text-white fill-white" />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[250px]" title={hl.title}>{hl.title}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            {hl.isFeatured && <span className="text-[9px] font-bold text-indigo-500 uppercase">Featured</span>}
                            {hl.isPremium && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Premium</span>}
                            <span className="text-[10px] text-slate-400 truncate">{hl.tags?.slice(0, 2).join(", ")}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge category={hl.category} />
                        {hl.duration > 0 && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} />{formatSecondsToTime(hl.duration)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-500">{hl.views || 0} views</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedHighlight(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setActiveHl(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Play">
                          <Play size={14} />
                        </button>
                        <button onClick={() => openEdit(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setCommentTarget(hl)} className="admin-action-btn-sm h-8 w-8 rounded-full !p-0" title="Comments">
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => handleDelete(hl._id)} disabled={deleting === hl._id} className="admin-action-btn-danger-sm h-8 w-8 rounded-full !p-0 disabled:opacity-50" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}


      <PlayModal hl={activeHl} onClose={() => setActiveHl(null)} />

      <SeriesMatchesModal
        open={seriesMatchesOpen}
        onClose={() => setSeriesMatchesOpen(false)}
        series={selectedItem}
        matches={matches}
        onSelectMatch={(mid) => {
          setViewType("match");
          setSelectedId(mid);
        }}
      />

      <HlModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditHl(null); }}
        matchId={viewType === "match" ? selectedId : ""}
        seriesId={viewType === "series" ? selectedId : ""}
        selectedSeries={selectedItem}
        highlight={editHl}
        onSaved={() => loadHighlights(selectedId)}
      />

      {/* View Modal */}
      <AnimatePresence>
        {selectedHighlight && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
            onClick={() => setSelectedHighlight(null)}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-2xl rounded-3xl bg-white p-0 shadow-2xl dark:bg-slate-900 overflow-hidden"
              onClick={e => e.stopPropagation()}>
              
              {/* Header with Background/Thumbnail */}
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                {selectedHighlight.thumbnail ? (
                  <img src={selectedHighlight.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                    <Video size={48} className="text-indigo-400 opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <button type="button" onClick={() => setSelectedHighlight(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 flex items-center justify-center backdrop-blur-md transition">
                  <X size={18} />
                </button>

                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge category={selectedHighlight.category} />
                    {selectedHighlight.isPremium && <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Premium</span>}
                    {selectedHighlight.isFeatured && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Featured</span>}
                  </div>
                  <h2 className="text-xl font-bold text-white truncate">{selectedHighlight.title}</h2>
                </div>

                <button onClick={() => { setActiveHl(selectedHighlight); setSelectedHighlight(null); }}
                  className="absolute bottom-4 right-6 h-12 w-12 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 transition-transform">
                  <Play size={20} className="fill-white ml-0.5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto pretty-scroll">
                {/* Context & Teams */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Content Context</p>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        {selectedHighlight.matchId ? (
                          <>
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500"><Film size={16} /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">Match Link</p>
                              <p className="text-[10px] text-slate-500 truncate">{selectedHighlight.matchId.title || "Match Details"}</p>
                            </div>
                          </>
                        ) : selectedHighlight.seriesId ? (
                          <>
                            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-500"><Film size={16} /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">Series Link</p>
                              <p className="text-[10px] text-slate-500 truncate">{selectedHighlight.seriesId.title || "Series Details"}</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No direct link</p>
                        )}
                      </div>
                    </div>

                    {selectedHighlight.liveLogo && (
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Live Logo</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <img src={selectedHighlight.liveLogo} alt="Live Logo" className="h-8 w-8 object-contain" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Live Logo</p>
                            <p className="text-[10px] text-slate-500">{selectedHighlight.showLiveLogo ? "Visible on player" : "Hidden on player"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Competing Teams</p>
                      <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                          {selectedHighlight.teamA?.logo ? <img src={selectedHighlight.teamA.logo} alt="" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />}
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{selectedHighlight.teamA?.name || "Team A"}</p>
                        </div>
                        <span className="text-xs font-black text-slate-300 dark:text-slate-600 italic">VS</span>
                        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                          {selectedHighlight.teamB?.logo ? <img src={selectedHighlight.teamB.logo} alt="" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />}
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">{selectedHighlight.teamB?.name || "Team B"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Media Stats</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Duration</p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{formatSecondsToTime(selectedHighlight.duration)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Views</p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{selectedHighlight.views || 0}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Order</p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{selectedHighlight.order || 0}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Source</p>
                          <p className="text-[10px] font-semibold text-slate-900 dark:text-slate-100 uppercase">{selectedHighlight.sourceType || "URL"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Video Link</p>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <Link size={14} className="text-indigo-400 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 truncate flex-1 font-mono">{selectedHighlight.videoUrl || "No URL provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedHighlight.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Description</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {selectedHighlight.description}
                    </p>
                  </div>
                )}

                {selectedHighlight.tags && selectedHighlight.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Tags / Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedHighlight.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">All Metadata Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Highlight ID", value: selectedHighlight._id },
                      { label: "Title", value: selectedHighlight.title },
                      { label: "Category", value: selectedHighlight.category || "-" },
                      { label: "Source Type", value: selectedHighlight.sourceType || "-" },
                      { label: "Video URL", value: selectedHighlight.videoUrl || "-" },
                      { label: "Thumbnail URL", value: selectedHighlight.thumbnail || "-" },
                      { label: "Live Logo URL", value: selectedHighlight.liveLogo || "-" },
                      { label: "Duration (secs)", value: selectedHighlight.duration || 0 },
                      { label: "Duration (formatted)", value: formatSecondsToTime(selectedHighlight.duration) },
                      { label: "Tags", value: selectedHighlight.tags?.join(", ") || "-" },
                      { label: "Featured", value: selectedHighlight.isFeatured ? "Yes" : "No" },
                      { label: "Premium", value: selectedHighlight.isPremium ? "Yes" : "No" },
                      { label: "Show Live Logo", value: selectedHighlight.showLiveLogo ? "Yes" : "No" },
                      { label: "Views", value: selectedHighlight.views || 0 },
                      { label: "Display Order", value: selectedHighlight.order || 0 },
                      { label: "Match ID", value: selectedHighlight.matchId?._id || selectedHighlight.matchId || "-" },
                      { label: "Match Title", value: selectedHighlight.matchId?.title || "-" },
                      { label: "Series ID", value: selectedHighlight.seriesId?._id || selectedHighlight.seriesId || "-" },
                      { label: "Series Title", value: selectedHighlight.seriesId?.title || "-" },
                      { label: "Team A ID", value: selectedHighlight.teamA?._id || selectedHighlight.teamA || "-" },
                      { label: "Team A Name", value: selectedHighlight.teamA?.name || "-" },
                      { label: "Team B ID", value: selectedHighlight.teamB?._id || selectedHighlight.teamB || "-" },
                      { label: "Team B Name", value: selectedHighlight.teamB?.name || "-" },
                      { label: "Created By", value: selectedHighlight.createdBy || "-" },
                      { label: "Created At", value: selectedHighlight.createdAt ? new Date(selectedHighlight.createdAt).toLocaleString() : "-" },
                      { label: "Updated At", value: selectedHighlight.updatedAt ? new Date(selectedHighlight.updatedAt).toLocaleString() : "-" }
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-slate-100" title={String(value)}>{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button type="button" onClick={() => { setSelectedHighlight(null); openEdit(selectedHighlight); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm">
                  <Edit2 size={16} /> Edit Metadata
                </button>
                <button type="button" onClick={() => { setSelectedHighlight(null); setDeleting(selectedHighlight._id); handleDelete(selectedHighlight._id); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition">
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommentModal
        open={Boolean(commentTarget)}
        onClose={() => setCommentTarget(null)}
        itemId={commentTarget?._id}
        itemName={commentTarget?.title}
      />
    </div>
  );
}
