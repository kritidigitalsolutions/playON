import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 text-center dark:bg-slate-950">
      <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100">404</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">This page does not exist.</p>
      <Link to="/dashboard" className="mt-5 rounded-xl bg-indigo-500 px-4 py-2 text-white">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
