import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

function WatchModal({ isOpen, onClose, watchData }) {
  if (!isOpen || !watchData) return null;

  const { title, streamUrl, streamType } = watchData;

  const renderPlayer = () => {
    if (!streamUrl) {
      return (
        <div className="flex h-64 w-full items-center justify-center bg-slate-900 text-slate-400">
          No Stream URL provided
        </div>
      );
    }

    const type = (streamType || "").toLowerCase();

    if (type === "iframe" || type === "youtube") {
      return (
        <iframe
          src={streamUrl}
          title="Stream Player"
          className="h-[40vh] w-full md:h-[60vh]"
          allowFullScreen
          frameBorder="0"
        />
      );
    }

    if (type === "mp4" || streamUrl.endsWith(".mp4")) {
      return (
        <video
          controls
          autoPlay
          className="h-[40vh] w-full bg-black md:h-[60vh]"
          src={streamUrl}
        />
      );
    }

    // For HLS/DASH or unknown types where a custom player is normally needed,
    // we just use a native video tag. Modern Safari supports HLS natively.
    return (
      <video
        controls
        autoPlay
        className="h-[40vh] w-full bg-black md:h-[60vh]"
        src={streamUrl}
      />
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-black shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
            <div>
              <h3 className="font-semibold text-slate-100">{title || "Live Stream"}</h3>
              {streamType && (
                <span className="mt-1 inline-block rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-indigo-400">
                  {streamType}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative w-full bg-black">
            {renderPlayer()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default WatchModal;
