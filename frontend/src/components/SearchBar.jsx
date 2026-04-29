import { Search } from "lucide-react";

function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <label className={`relative block ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900"
      />
    </label>
  );
}

export default SearchBar;
