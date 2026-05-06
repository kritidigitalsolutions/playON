import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Clock, Edit2, Film, Link, Play,
  Plus, RefreshCw, Tag, Trash2, Upload, Video, X, Lock
} from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";

const cx = (...p) => p.filter(Boolean).join(" ");

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

const EMPTY_FORM = { title: "", description: "", category: "other", sourceType: "url", videoUrl: "", duration: "", tags: "", isPremium: false, order: 0 };

function Badge({ category }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", CAT_COLORS[category] || CAT_COLORS.other)}>
      <Tag size={9} />{CAT_LABELS[category] || category}
    </span>
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

function HlModal({ open, onClose, matchId, highlight, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const videoRef = useRef();
  const thumbRef = useRef();

  useEffect(() => {
    if (highlight) {
      setForm({
        title: highlight.title || "",
        description: highlight.description || "",
        category: highlight.category || "other",
        sourceType: highlight.sourceType || "url",
        videoUrl: highlight.videoUrl || "",
        duration: highlight.duration || "",
        tags: Array.isArray(highlight.tags) ? highlight.tags.join(", ") : "",
        isPremium: !!highlight.isPremium,
        order: highlight.order ?? 0
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setThumbFile(null); setVideoFile(null); setErr("");
  }, [highlight, open]);

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
      fd.append("matchId", matchId);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (thumbFile) fd.append("thumbnail", thumbFile);
      if (videoFile) fd.append("videoFile", videoFile);

      if (highlight) {
        await api.patch(`/admin/highlights/${highlight._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/admin/highlights", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      onSaved();
      onClose();
    } catch (er) {
      setErr(er?.response?.data?.message || "Save failed");
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

          <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
            {err && <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">{err}</div>}

            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Rohit's Century" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={form.category} onChange={e => set("category", e.target.value)}>
                  {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Duration</label>
                <input className={inputCls} value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="e.g. 2:30" />
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
                <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0] || null)} />
              </div>
            )}

            <div>
              <label className={labelCls}>Thumbnail Image (optional)</label>
              <div onClick={() => thumbRef.current?.click()}
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
                <Film size={18} className="text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{thumbFile ? thumbFile.name : "Click to select image"}</span>
              </div>
              <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => setThumbFile(e.target.files[0] || null)} />
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPremium} onChange={e => set("isPremium", e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Premium only</span>
            </label>
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
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingHl, setLoadingHl] = useState(false);
  const [activeHl, setActiveHl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHl, setEditHl] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await api.get("/admin/matches", { params: { limit: "all" } });
      const list = res?.data?.matches || [];
      setMatches(list);
      if (list.length && !selectedMatchId) setSelectedMatchId(list[0]._id);
    } catch { setError("Could not load matches."); }
    finally { setLoadingMatches(false); }
  };

  const loadHighlights = async (mid) => {
    if (!mid) return;
    setLoadingHl(true); setError("");
    try {
      const res = await api.get("/admin/highlights", { params: { matchId: mid } });
      setHighlights(res?.data?.highlights || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load highlights");
      setHighlights([]);
    } finally { setLoadingHl(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadMatches(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedMatchId) loadHighlights(selectedMatchId); }, [selectedMatchId]);

  const selectedMatch = matches.find(m => m._id === selectedMatchId);

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
        title="Match Highlights"
        subtitle="Add, edit and manage video highlight clips per match."
        action={
          <div className="flex gap-2">
            <button onClick={() => loadHighlights(selectedMatchId)} disabled={!selectedMatchId || loadingHl}
              className="admin-toolbar-btn">
              <RefreshCw size={14} className={loadingHl ? "animate-spin" : ""} />Refresh
            </button>
            <button onClick={openAdd} disabled={!selectedMatchId}
              className="admin-toolbar-btn bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50">
              <Plus size={14} />Add Highlight
            </button>
          </div>
        }
      />

      {/* Match Selector */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Film size={16} className="text-indigo-400" />Select Match
        </h2>
        {loadingMatches ? (
          <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : (
          <div className="relative">
            <select value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              <option value="">-- Choose a match --</option>
              {matches.map(m => (
                <option key={m._id} value={m._id}>{m.title || `${m.teamA} vs ${m.teamB}`} ({m.status})</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        )}
        {selectedMatch && (
          <div className="mt-4 flex items-center gap-3">
            {selectedMatch.thumbnail && <img src={selectedMatch.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedMatch.title || `${selectedMatch.teamA} vs ${selectedMatch.teamB}`}
              </p>
              <p className="text-xs text-slate-500">
                {selectedMatch.sport?.toUpperCase()} • {selectedMatch.tournament || "No Tournament"} •{" "}
                <span className={cx(selectedMatch.status === "live" && "text-rose-500", selectedMatch.status === "upcoming" && "text-blue-500", selectedMatch.status === "completed" && "text-emerald-500")}>
                  {selectedMatch.status}
                </span>
              </p>
            </div>
            <span className="ml-auto text-sm font-semibold text-indigo-500">{highlights.length} clips</span>
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

      {!loadingHl && selectedMatchId && !error && highlights.length === 0 && (
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {highlights.map((hl, i) => (
              <motion.div key={hl._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04 }}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition dark:bg-slate-900">
                {/* Thumbnail */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  {hl.thumbnail ? (
                    <img src={hl.thumbnail} alt={hl.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Video size={36} className="text-slate-600" /></div>
                  )}
                  <button onClick={() => setActiveHl(hl)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur border border-white/30 hover:bg-white/30">
                      <Play size={24} className="text-white fill-white ml-1" />
                    </span>
                  </button>
                  {hl.duration && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-white">
                      <Clock size={10} />{hl.duration}
                    </div>
                  )}
                  {hl.isPremium && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-xs font-medium text-white">
                      <Lock size={10} />Premium
                    </div>
                  )}
                  <div className="absolute top-2 left-2"><Badge category={hl.category} /></div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{hl.title}</h3>
                  {hl.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{hl.description}</p>}
                  {hl.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hl.tags.slice(0, 4).map(t => (
                        <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-4 flex gap-2">
                    <button onClick={() => setActiveHl(hl)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-violet-600 transition">
                      <Play size={13} className="fill-white" />Play
                    </button>
                    <button onClick={() => openEdit(hl)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-indigo-500 hover:border-indigo-300 transition">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(hl._id)} disabled={deleting === hl._id}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition disabled:opacity-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PlayModal hl={activeHl} onClose={() => setActiveHl(null)} />

      <HlModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditHl(null); }}
        matchId={selectedMatchId}
        highlight={editHl}
        onSaved={() => loadHighlights(selectedMatchId)}
      />
    </div>
  );
}
