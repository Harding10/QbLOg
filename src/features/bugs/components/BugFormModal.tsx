"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, BugStatus, BugSeverity, Assignee } from "@/lib/firebase/services/bugs";
import { uploadFile } from "@/lib/firebase/services/files";
import { useAuth } from "@/context/AuthContext";
import { X, UploadCloud, Check, ChevronDown } from "lucide-react";
import Image from "next/image";

export const MOCK_TEAMMATES: Assignee[] = [
  { name: "John Doe", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", email: "john.doe@example.com" },
  { name: "Jane Smith", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", email: "jane.smith@example.com" },
  { name: "Linus Torvalds", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", email: "torvalds@linux.org" },
  { name: "Sarah Connor", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", email: "sarah@skynet.com" }
];

interface BugFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    severity: BugSeverity;
    status: BugStatus;
    assignee: Assignee | null;
    screenshotUrl?: string | null;
  }) => Promise<void>;
  editBug?: Bug | null;
}

export function BugFormModal({ isOpen, onClose, onSubmit, editBug }: BugFormModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("medium");
  const [status, setStatus] = useState<BugStatus>("open");
  const [assignee, setAssignee] = useState<Assignee | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editBug) {
      setTitle(editBug.title);
      setDescription(editBug.description);
      setSeverity(editBug.severity);
      setStatus(editBug.status);
      setAssignee(editBug.assignee || null);
      setScreenshotUrl(editBug.screenshotUrl || null);
    } else {
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setStatus("open");
      setAssignee(null);
      setScreenshotUrl(null);
    }
  }, [editBug, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const fileData = await uploadFile(file, user.uid, null, (prog) => setUploadProgress(prog));
      setScreenshotUrl(fileData.url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), severity, status, assignee, screenshotUrl });
    } finally {
      setSubmitting(false);
    }
  };

  const severityOptions: { value: BugSeverity; label: string; color: string }[] = [
    { value: "low", label: "Faible", color: "text-emerald-400" },
    { value: "medium", label: "Moyen", color: "text-blue-400" },
    { value: "high", label: "Élevé", color: "text-amber-400" },
    { value: "critical", label: "Critique", color: "text-rose-400" },
  ];

  const statusOptions: { value: BugStatus; label: string; dot: string }[] = [
    { value: "open", label: "Ouvert", dot: "bg-gray-400" },
    { value: "in_progress", label: "En cours", dot: "bg-blue-400" },
    { value: "resolved", label: "Résolu", dot: "bg-emerald-400" },
    { value: "closed", label: "Fermé", dot: "bg-purple-400" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto bg-[#0d1117] rounded-2xl w-full max-w-lg border border-white/[0.06] shadow-2xl shadow-white/40 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-white tracking-tight">
                  {editBug ? "Modifier le ticket" : "Nouveau ticket"}
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2">Titre</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Décrivez le bug en une ligne..."
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[13px] px-4 py-2.5 placeholder-gray-600 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Étapes de reproduction, comportement attendu..."
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-[13px] px-4 py-2.5 placeholder-gray-600 resize-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2">Priorité</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {severityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSeverity(opt.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            severity === opt.value
                              ? `${opt.color} bg-white/[0.06] border-white/[0.1]`
                              : "text-gray-500 bg-transparent border-white/[0.04] hover:border-white/[0.08] hover:text-gray-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2">Statut</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(opt.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                            status === opt.value
                              ? "text-gray-200 bg-white/[0.06] border-white/[0.1]"
                              : "text-gray-500 bg-transparent border-white/[0.04] hover:border-white/[0.08] hover:text-gray-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2">Assigner à</label>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_TEAMMATES.map((member) => {
                      const isSelected = assignee?.email === member.email;
                      return (
                        <button
                          key={member.email}
                          type="button"
                          onClick={() => setAssignee(isSelected ? null : member)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-violet-500/10 border-violet-500/30 text-violet-300 ring-1 ring-violet-500/20"
                              : "bg-white/[0.02] border-white/[0.04] text-gray-400 hover:border-white/[0.08] hover:text-gray-300"
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/10 shrink-0">
                            {member.avatarUrl ? (
                              <Image src={member.avatarUrl} alt={member.name} width={20} height={20} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center text-[8px] font-bold">{member.name[0]}</div>
                            )}
                          </div>
                          {member.name.split(" ")[0]}
                          {isSelected && <Check className="w-3 h-3 text-violet-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Screenshot */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2">Capture d&#39;écran</label>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" disabled={uploading} />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 border border-dashed border-white/[0.08] rounded-xl px-4 py-2.5 text-[11px] font-medium text-gray-500 hover:text-gray-300 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {uploading ? `${Math.round(uploadProgress)}%` : "Uploader"}
                    </button>
                    {screenshotUrl && (
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-white/[0.06] group">
                        <Image src={screenshotUrl} alt="Capture" width={56} height={40} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshotUrl(null)}
                          className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="mt-2 w-full h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading || submitting || !title.trim()}
                  className="px-5 py-2 text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sauvegarde...
                    </span>
                  ) : editBug ? "Sauvegarder" : "Créer le ticket"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
