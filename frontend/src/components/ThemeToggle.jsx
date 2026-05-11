import { motion, AnimatePresence } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 p-0 shadow-sm transition hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ y: -10, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 10, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full items-center justify-center text-indigo-400"
          >
            <MoonStar size={18} fill="currentColor" fillOpacity={0.1} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -10, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 10, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
            className="flex h-full w-full items-center justify-center text-amber-500"
          >
            <SunMedium size={18} fill="currentColor" fillOpacity={0.1} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default ThemeToggle;
