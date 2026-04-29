function Loader({ lines = 4 }) {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"
        />
      ))}
    </div>
  );
}

export default Loader;
