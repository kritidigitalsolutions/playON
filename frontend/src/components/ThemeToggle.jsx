import { motion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative flex h-10 w-20 items-center rounded-full border border-slate-200/70 bg-white/80 p-1 shadow-sm transition dark:border-slate-700 dark:bg-slate-900/70"
      aria-label="Toggle theme"
    >
      <motion.span
        animate={{ x: isDark ? 40 : 0, rotate: isDark ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
      >
        {isDark ? <MoonStar size={16} /> : <SunMedium size={16} />}
      </motion.span>
    </button>
  );
}

export default ThemeToggle;
