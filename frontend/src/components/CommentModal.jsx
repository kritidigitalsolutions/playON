import {
  useEffect,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  MessageSquare,
  Trash2,
  X,
  User
} from "lucide-react";

import api from "../api/axios";

export default function CommentModal({
  open,
  onClose,
  itemId,
  itemName
}) {
  const [comments, setComments] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  // LOAD COMMENTS
  const loadComments = async () => {
    if (!itemId) return;

    try {
      setLoading(true);

      setError("");

      const response =
        await api.get(
          `/admin/comments/${itemId}`
        );

      setComments(
        Array.isArray(
          response?.data?.comments
        )
          ? response.data.comments
          : []
      );

    } catch (err) {
      setError(
        err?.response?.data
          ?.message ||
          "Unable to load comments"
      );
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  if (open && itemId) {
    loadComments();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, itemId]);

  // DELETE COMMENT
  const deleteComment = async (
    commentId
  ) => {
    try {
      setDeletingId(commentId);

      await api.delete(
        `/admin/comments/${commentId}`
      );

      setComments((prev) =>
        prev.filter(
          (c) =>
            c._id !== commentId
        )
      );

    } catch (err) {
      alert(
        err?.response?.data
          ?.message ||
          "Delete failed"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          className="flex h-full max-h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <MessageSquare
                  size={20}
                />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Comments
                </h2>

                <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                  {itemName ||
                    "Content Item"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 pretty-scroll">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

                <p className="text-sm text-slate-500">
                  Loading comments...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 p-4 text-center text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </div>
            ) : comments.length ===
              0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-4 dark:bg-slate-800/50">
                  <MessageSquare
                    size={32}
                    className="text-slate-300 dark:text-slate-600"
                  />
                </div>

                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  No comments yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Be the first to
                  see what users
                  say!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(
                  (comment) => (
                    <div
                      key={
                        comment._id
                      }
                      className="group relative flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                    >
                      {/* Avatar */}
                      <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        {comment
                          .userId
                          ?.profilePic ? (
                          <img
                            src={
                              comment
                                .userId
                                .profilePic
                            }
                            alt={
                              comment
                                .userId
                                .fullName
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <User
                              size={
                                16
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {comment
                              .userId
                              ?.fullName ||
                              "Unknown User"}
                          </h4>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                              {new Date(
                                comment.createdAt
                              ).toLocaleDateString()}
                            </span>

                            <button
                              onClick={() =>
                                deleteComment(
                                  comment._id
                                )
                              }
                              disabled={
                                deletingId ===
                                comment._id
                              }
                              className="rounded-lg p-1 text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              title="Delete Comment"
                            >
                              {deletingId ===
                              comment._id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                              ) : (
                                <Trash2
                                  size={
                                    14
                                  }
                                />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {
                            comment.comment
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}