import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Circle, Radio, Shield, Trophy } from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import { sportsCategories as fallbackSports } from "../utils/adminFallbackData";

const iconMap = { Trophy, Radio, Shield, Circle };

function Sports() {
  const [sports, setSports] = useState(fallbackSports);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSports = async () => {
      try {
        const response = await api.get("/sports/cricket/live");
        if (mounted && Array.isArray(response?.data?.sports)) {
          setSports(response.data.sports);
        }
      } catch (error) {
        setSports(fallbackSports);
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

  return (
    <div>
      <PageHeader title="Sports" subtitle="Category-wise coverage and live counters." />

      {loading ? (
        <Loader lines={5} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sports.map((sport, index) => {
            const Icon = iconMap[sport.icon] || Trophy;

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
