import { Inbox } from "lucide-react";

function EmptyState({ title = "No data available", message = "Try adjusting filters or refresh." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/60 px-6 py-12 text-center dark:bg-slate-900/60">
      <Inbox className="mb-3 text-slate-400" size={28} />
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export default EmptyState;
