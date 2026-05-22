"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, BugStatus, BugSeverity, Assignee, BugComment, BugActivity } from "@/lib/firebase/services/bugs";
import { BugTimeline } from "./BugTimeline";
import { MOCK_TEAMMATES } from "./BugFormModal";
import { X, Calendar, Paperclip, Send, Trash2, ArrowUpRight, MessageCircle, Activity, Settings2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface BugDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bug: Bug | null;
  comments: BugComment[];
  activities: BugActivity[];
  detailLoading: boolean;
  onUpdateBug: (id: string, updates: Partial<Bug>) => Promise<void>;
  onDeleteBug: (id: string) => Promise<void>;
  onAddComment: (bugId: string, text: string) => Promise<void>;
  onDeleteComment: (bugId: string, commentId: string) => Promise<void>;
  onOpenEditModal: () => void;
}

export function BugDetailDrawer({
  isOpen,
  onClose,
  bug,
  comments,
  activities,
  detailLoading,
  onUpdateBug,
  onDeleteBug,
  onAddComment,
  onDeleteComment,
  onOpenEditModal
}: BugDetailDrawerProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  if (!bug) return null;

  const handleStatusChange = (status: BugStatus) => onUpdateBug(bug.id!, { status });
  const handleSeverityChange = (severity: BugSeverity) => onUpdateBug(bug.id!, { severity });
  const handleAssigneeChange = (email: string) => {
    const selected = MOCK_TEAMMATES.find((t) => t.email === email) || null;
    onUpdateBug(bug.id!, { assignee: selected });
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commenting) return;
    setCommenting(true);
    try {
      await onAddComment(bug.id!, newComment);
      setNewComment("");
    } finally {
      setCommenting(false);
    }
  };

  const statusOptions: { value: BugStatus; label: string; dot: string }[] = [
    { value: "open", label: "Ouvert", dot: "bg-gray-400" },
    { value: "in_progress", label: "En cours", dot: "bg-blue-400" },
    { value: "resolved", label: "Résolu", dot: "bg-emerald-400" },
    { value: "closed", label: "Fermé", dot: "bg-purple-400" },
  ];

  const severityOptions: { value: BugSeverity; label: string; color: string }[] = [
    { value: "low", label: "Faible", color: "text-emerald-400" },
    { value: "medium", label: "Moyen", color: "text-blue-400" },
    { value: "high", label: "Élevé", color: "text-amber-400" },
    { value: "critical", label: "Critique", color: "text-rose-400" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring" as const, damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] md:w-[720px] lg:w-[900px] bg-[#0d1117] border-l border-white/[0.04] shadow-2xl shadow-white/50 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-semibold text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.04]">
                  #{bug.id?.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-[11px] text-gray-600">•</span>
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {bug.createdAt?.toDate ? bug.createdAt.toDate().toLocaleDateString("fr-FR") : "Récent"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={onOpenEditModal} className="px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-all">
                  Modifier
                </button>
                <button
                  onClick={async () => { await onDeleteBug(bug.id!); onClose(); }}
                  className="px-3 py-1.5 text-[11px] font-medium text-rose-400/80 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-lg transition-all"
                >
                  Supprimer
                </button>
                <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5">
              {/* Main Content */}
              <div className="col-span-3 overflow-y-auto p-6 space-y-6 border-r border-white/[0.04]">
                {/* Title */}
                <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {bug.title}
                </h1>

                {/* Description */}
                {bug.description ? (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                    <p className="text-[13px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {bug.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-600 italic">Aucune description.</p>
                )}

                {/* Screenshot */}
                {bug.screenshotUrl && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 flex items-center gap-1.5 mb-3">
                      <Paperclip className="w-3.5 h-3.5" /> Pièce jointe
                    </span>
                    <a href={bug.screenshotUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-block rounded-xl overflow-hidden border border-white/[0.06] group cursor-zoom-in">
                      <Image src={bug.screenshotUrl} alt="Screenshot" width={500} height={300}
                        className="max-h-[250px] object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                    </a>
                  </div>
                )}

                {/* Tabs (Comments / Activity) */}
                <div className="border-t border-white/[0.04] pt-5">
                  <div className="flex gap-1 mb-4 bg-white/[0.02] p-1 rounded-xl border border-white/[0.04] w-fit">
                    <button
                      onClick={() => setActiveTab("comments")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                        activeTab === "comments"
                          ? "bg-white/[0.06] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Commentaires
                      {comments.length > 0 && (
                        <span className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-md">{comments.length}</span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                        activeTab === "activity"
                          ? "bg-white/[0.06] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Activité
                    </button>
                  </div>

                  {activeTab === "comments" ? (
                    <div className="space-y-3">
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {comments.map((comment) => {
                          const isOwner = comment.userId === user?.uid;
                          const date = comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date();
                          return (
                            <div key={comment.id} className="flex gap-3 group">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 ring-1 ring-white/10 text-[9px] font-bold text-white flex items-center justify-center shrink-0 mt-0.5">
                                {comment.userAvatar ? (
                                  <Image src={comment.userAvatar} alt={comment.userName} width={28} height={28} className="w-full h-full rounded-full object-cover" />
                                ) : comment.userName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 relative">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-semibold text-gray-300">{comment.userName}</span>
                                  <span className="text-[10px] text-gray-600">{date.toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <p className="text-[12px] text-gray-400 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                {isOwner && (
                                  <button
                                    onClick={() => onDeleteComment(bug.id!, comment.id!)}
                                    className="absolute top-2 right-2 p-1 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={commentsEndRef} />
                      </div>

                      {/* Add comment */}
                      <form onSubmit={handleAddCommentSubmit} className="flex gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Ajouter un commentaire..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[12px] px-3.5 py-2 placeholder-gray-600 focus:border-violet-500/40 focus:outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={commenting || !newComment.trim()}
                          className="p-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-30 shrink-0 shadow-lg shadow-violet-500/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto pr-1">
                      {detailLoading ? (
                        <div className="flex justify-center py-8">
                          <span className="w-5 h-5 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <BugTimeline activities={activities} />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Properties */}
              <div className="col-span-2 overflow-y-auto p-5 space-y-5 bg-[#0a0e14]">
                <div className="flex items-center gap-2 mb-1">
                  <Settings2 className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Propriétés</span>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-600 block">Statut</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                          bug.status === opt.value
                            ? "text-white bg-white/[0.06] border-white/[0.1]"
                            : "text-gray-500 border-white/[0.03] hover:border-white/[0.08] hover:text-gray-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-600 block">Priorité</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {severityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSeverityChange(opt.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                          bug.severity === opt.value
                            ? `${opt.color} bg-white/[0.06] border-white/[0.1]`
                            : "text-gray-500 border-white/[0.03] hover:border-white/[0.08] hover:text-gray-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-600 block">Assigné à</label>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => onUpdateBug(bug.id!, { assignee: null })}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium border transition-all ${
                        !bug.assignee
                          ? "text-gray-300 bg-white/[0.06] border-white/[0.1]"
                          : "text-gray-500 border-white/[0.03] hover:border-white/[0.08]"
                      }`}
                    >
                      Non assigné
                    </button>
                    {MOCK_TEAMMATES.map((m) => {
                      const isSelected = bug.assignee?.email === m.email;
                      return (
                        <button
                          key={m.email}
                          onClick={() => handleAssigneeChange(m.email!)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium border transition-all ${
                            isSelected
                              ? "text-violet-300 bg-violet-500/10 border-violet-500/20"
                              : "text-gray-500 border-white/[0.03] hover:border-white/[0.08] hover:text-gray-400"
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/10 shrink-0">
                            {m.avatarUrl ? (
                              <Image src={m.avatarUrl} alt={m.name} width={20} height={20} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center text-[8px] font-bold">{m.name[0]}</div>
                            )}
                          </div>
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
