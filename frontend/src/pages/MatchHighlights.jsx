import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Clock,
  Film,
  Flame,
  Play,
  RefreshCw,
  Search,
  Tag,
  Trophy,
  Video,
  X
} from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const cx = (...parts) => parts.filter(Boolean).join(" ");

const CATEGORY_LABELS = {
  full_match: "Full Match",
  batting: "Batting",
  bowling: "Bowling",
  fielding: "Fielding",
  goal: "Goal",
  save: "Save",
  other: "Other"
};

const CATEGORY_COLORS = {
  full_match: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  batting: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  bowling: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  fielding: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  goal: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  save: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  other: "bg-slate-500/15 text-slate-400 border-slate-500/30"
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */
function CategoryBadge({ category }) {
  const label = CATEGORY_LABELS[category] || category || "Other";
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        color
      )}
    >
      <Tag size={9} />
      {label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function VideoModal({ highlight, onClose }) {
  if (!highlight) return null;

  const isYoutube =
    highlight.videoUrl?.includes("youtube.com") ||
    highlight.videoUrl?.includes("youtu.be");

  const embedSrc = isYoutube
    ? highlight.videoUrl
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "www.youtube.com/embed/")
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-3xl rounded-2xl bg-slate-950 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white truncate">
                {highlight.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CategoryBadge category={highlight.category} />
                {highlight.duration && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={11} /> {highlight.duration}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg bg-white/10 p-1.5 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Video */}
          <div className="relative aspect-video bg-black">
            {isYoutube ? (
              <iframe
                src={embedSrc}
                title={highlight.title}
                className="h-full w-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={highlight.videoUrl}
                className="h-full w-full object-contain"
                controls
                autoPlay
              />
            )}
          </div>

          {/* Description */}
          {highlight.description && (
            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-sm text-slate-300">{highlight.description}</p>
              {highlight.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {highlight.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
function MatchHighlights() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [matchMeta, setMatchMeta] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeHighlight, setActiveHighlight] = useState(null);

  /* Fetch all matches (for the dropdown) */
  const loadMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await api.get("/admin/matches");
      const list = Array.isArray(res?.data?.matches) ? res.data.matches : [];
      setMatches(list);
      if (list.length > 0 && !selectedMatchId) {
        setSelectedMatchId(list[0]._id);
      }
    } catch {
      setError("Could not load matches.");
    } finally {
      setLoadingMatches(false);
    }
  };

  /* Fetch highlights for a given matchId */
  const loadHighlights = async (matchId) => {
    if (!matchId) return;
    try {
      setLoadingHighlights(true);
      setError("");
      setHighlights([]);
      setMatchMeta(null);
      const res = await api.get(`/scores/${matchId}/highlights`);
      const data = res?.data?.data;
      if (data) {
        setMatchMeta({ matchTitle: data.matchTitle, sport: data.sport, matchId: data.matchId });
        setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      } else {
        setHighlights([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 404) {
        setHighlights([]);
        setError("No highlights found for this match.");
      } else {
        setError(msg || "Failed to load highlights.");
      }
    } finally {
      setLoadingHighlights(false);
    }
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      loadHighlights(selectedMatchId);
      setSearch("");
      setCategoryFilter("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId]);

  /* Derived data */
  const categories = useMemo(() => {
    const cats = Array.from(new Set(highlights.map((h) => h.category).filter(Boolean)));
    return cats;
  }, [highlights]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return highlights.filter((h) => {
      const catOk = categoryFilter === "all" || h.category === categoryFilter;
      const searchOk =
        !q ||
        [h.title, h.description, ...(h.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      return catOk && searchOk;
    });
  }, [highlights, search, categoryFilter]);

  const selectedMatch = matches.find((m) => m._id === selectedMatchId);

  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Match Highlights"
        subtitle="Browse and preview video highlight clips for each match."
        action={
          <button
            type="button"
            onClick={() => loadHighlights(selectedMatchId)}
            disabled={!selectedMatchId || loadingHighlights}
            className="admin-toolbar-btn"
          >
            <RefreshCw size={14} className={loadingHighlights ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Match selector card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900"
      >
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Trophy size={16} className="text-indigo-400" /> Select Match
        </h2>

        {loadingMatches ? (
          <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : (
          <div className="relative">
            <select
              id="match-select"
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">-- Choose a match --</option>
              {matches.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title || `${m.teamA} vs ${m.teamB}`}
                  {m.status ? ` (${m.status})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        )}

        {/* Selected match meta pill */}
        {selectedMatch && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {selectedMatch.thumbnail && (
              <img
                src={selectedMatch.thumbnail}
                alt={selectedMatch.title}
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedMatch.title || `${selectedMatch.teamA} vs ${selectedMatch.teamB}`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedMatch.sport?.toUpperCase()} •{" "}
                {selectedMatch.tournament || "No Tournament"} •{" "}
                <span
                  className={cx(
                    "font-medium",
                    selectedMatch.status === "live" && "text-rose-500",
                    selectedMatch.status === "upcoming" && "text-blue-500",
                    selectedMatch.status === "completed" && "text-emerald-500"
                  )}
                >
                  {selectedMatch.status}
                </span>
              </p>
            </div>
          </div>
        )}
      </motion.section>

      {/* Filters */}
      {!loadingHighlights && highlights.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-3"
        >
          <label className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search highlights..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={cx(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                categoryFilter === "all"
                  ? "border-indigo-400 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cx(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                  categoryFilter === cat
                    ? "border-indigo-400 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                )}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Stats bar */}
      {!loadingHighlights && matchMeta && highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 sm:grid-cols-3"
        >
          {[
            { label: "Total Clips", value: highlights.length, icon: Film, color: "text-indigo-400" },
            { label: "Showing", value: filtered.length, icon: Video, color: "text-emerald-400" },
            { label: "Sport", value: matchMeta.sport?.toUpperCase() || "-", icon: Flame, color: "text-amber-400" }
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <div
                key={chip.label}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900"
              >
                <Icon size={20} className={chip.color} />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {chip.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {chip.value}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Content area */}
      <section>
        {/* Loading skeletons */}
        {loadingHighlights && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loadingHighlights && error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <X size={16} /> {error}
          </div>
        )}

        {/* No match selected */}
        {!loadingHighlights && !selectedMatchId && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm dark:bg-slate-900 text-center">
            <Film size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              Select a match above to view its highlights.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loadingHighlights && selectedMatchId && !error && highlights.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm dark:bg-slate-900 text-center">
            <Video size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium text-slate-600 dark:text-slate-300">No highlights available</p>
            <p className="mt-1 text-sm text-slate-400">
              This match doesn't have any video clips yet.
            </p>
          </div>
        )}

        {/* No search results */}
        {!loadingHighlights && !error && highlights.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 shadow-sm dark:bg-slate-900 text-center">
            <Search size={32} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No highlights match your search.</p>
          </div>
        )}

        {/* Highlight grid */}
        {!loadingHighlights && filtered.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filtered.map((hl, index) => (
                <motion.div
                  key={hl.id || hl.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: index * 0.04 }}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md dark:bg-slate-900"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    {hl.thumbnail ? (
                      <img
                        src={hl.thumbnail}
                        alt={hl.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Video size={36} />
                      </div>
                    )}

                    {/* Play overlay */}
                    <button
                      type="button"
                      onClick={() => setActiveHighlight(hl)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-label={`Play ${hl.title}`}
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 transition hover:bg-white/30">
                        <Play size={24} className="text-white fill-white ml-1" />
                      </span>
                    </button>

                    {/* Duration badge */}
                    {hl.duration && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                        <Clock size={10} /> {hl.duration}
                      </div>
                    )}

                    {/* Category badge */}
                    {hl.category && (
                      <div className="absolute left-2 top-2">
                        <CategoryBadge category={hl.category} />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3
                      className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
                      title={hl.title}
                    >
                      {hl.title}
                    </h3>

                    {hl.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {hl.description}
                      </p>
                    )}

                    {hl.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {hl.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveHighlight(hl)}
                        id={`play-highlight-${hl.id || index}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:from-indigo-600 hover:to-violet-600"
                      >
                        <Play size={14} className="fill-white" />
                        Watch Highlight
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Video Modal */}
      {activeHighlight && (
        <VideoModal
          highlight={activeHighlight}
          onClose={() => setActiveHighlight(null)}
        />
      )}
    </div>
  );
}

export default MatchHighlights;
