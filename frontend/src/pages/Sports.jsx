import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Circle, Radio, Shield, Trophy } from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import { sportsCategories as fallbackSports } from "../utils/adminFallbackData";

const iconBySport = {
  cricket: Trophy,
  football: Shield,
  basketball: Circle,
  kabaddi: Radio,
  tennis: Circle,
  volleyball: Circle,
  other: Trophy
};

const toTitleCase = (value = "") =>
  value
    .toString()
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

function Sports() {
  const [sports, setSports] = useState(fallbackSports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchSports = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/matches", {
          params: { page: 1, limit: 500 }
        });

        const matches = Array.isArray(response?.data?.matches) ? response.data.matches : [];

        const sportMap = matches.reduce((acc, match) => {
          const key = (match?.sport || "other").toLowerCase();

          if (!acc[key]) {
            acc[key] = {
              id: `sport-${key}`,
              name: toTitleCase(key),
              total: 0,
              live: 0,
              icon: key
            };
          }

          acc[key].total += 1;
          if ((match?.status || "").toLowerCase() === "live") {
            acc[key].live += 1;
          }

          return acc;
        }, {});

        const dynamicSports = Object.values(sportMap).sort((a, b) => b.total - a.total);

        if (mounted) {
          setSports(dynamicSports.length ? dynamicSports : fallbackSports);
        }
      } catch (apiError) {
        if (mounted) {
          setSports(fallbackSports);
          setError(apiError?.response?.data?.message || "Using fallback sports data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSports();

    return () => {
      mounted = false;
    };
  }, []);

  const totalSports = useMemo(() => sports.length, [sports]);

  return (
    <div>
      <PageHeader title="Sports" subtitle="Category-wise coverage and live counters." />

      {error ? <p className="mb-4 text-sm text-amber-500">{error}</p> : null}

      {!loading ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Sports Covered</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalSports}</p>
        </div>
      ) : null}

      {loading ? (
        <Loader lines={5} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sports.map((sport, index) => {
            const key = (sport.icon || sport.name || "other").toLowerCase();
            const Icon = iconBySport[key] || Trophy;

            return (
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{sport.name}</p>
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{sport.total}</p>
                <p className="mt-1 text-xs text-emerald-400">{sport.live} live now</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Sports;
