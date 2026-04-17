import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatNumber } from "../utils/helpers";

function StatCard({ title, value, growth, trend, index = 0, currency = false }) {
  const isNumeric = typeof value === "number";
  const displayValue = isNumeric ? (currency ? formatCurrency(value) : formatNumber(value)) : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{displayValue}</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {trend === "down" ? (
          <ArrowDownRight size={14} className="text-rose-400" />
        ) : (
          <ArrowUpRight size={14} className="text-emerald-400" />
        )}
        <span className={trend === "down" ? "text-rose-400" : "text-emerald-400"}>{growth}</span>
      </div>
    </motion.div>
  );
}

export default StatCard;
