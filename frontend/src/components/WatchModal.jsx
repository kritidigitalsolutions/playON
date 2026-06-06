import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Hls from "hls.js";
import { X } from "lucide-react";

const getYouTubeEmbedUrl = (url = "") => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const videoId = parsed.pathname.split("/")[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
      }

      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
  } catch {
    return url;
  }

  return url;
};

function UniversalPlayer({ streamUrl, streamType }) {
  const videoRef = useRef(null);
  const type = (streamType || "").toLowerCase();
  const isHls = type === "hls" || streamUrl.toLowerCase().includes(".m3u8");
  const isYouTube = type === "youtube";
  const isIframe = type === "iframe";
  const youtubeUrl = useMemo(() => getYouTubeEmbedUrl(streamUrl), [streamUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHls || isYouTube || isIframe) return;

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS Error:", data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => { });
    }
  }, [streamUrl, isHls, isYouTube, isIframe]);

  if (isYouTube) {
    return (
      <iframe
        src={youtubeUrl}
        title="Stream Player"
        className="h-[40vh] w-full md:h-[60vh]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        frameBorder="0"
      />
    );
  }

  if (isIframe) {
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

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      muted
      className="h-[40vh] w-full bg-black md:h-[60vh]"
      src={isHls ? undefined : streamUrl}
    />
  );
}

function WatchModal({ isOpen, onClose, watchData }) {
  if (!isOpen || !watchData) return null;

  const {
    title,
    streamUrl,
    streamType,
    liveLogo,
    showLiveLogo
  } = watchData;

  const renderPlayer = () => {
    if (!streamUrl) {
      return (
        <div className="flex h-64 w-full items-center justify-center bg-slate-900 text-slate-400">
          No Stream URL provided
        </div>
      );
    }

    return <UniversalPlayer streamUrl={streamUrl} streamType={streamType} />;
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

  {showLiveLogo && liveLogo && (
    <div className="pointer-events-none absolute right-4 top-4 z-50">
      <img
        src={liveLogo}
        alt="Live Logo"
        className="max-h-16 w-auto object-contain drop-shadow-lg"
      />
    </div>
  )}
</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default WatchModal;