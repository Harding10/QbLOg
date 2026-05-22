"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bug, BugStatus, BugSeverity } from "@/lib/firebase/services/bugs";
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle2, Paperclip, User, GripVertical } from "lucide-react";
import Image from "next/image";

interface BugKanbanBoardProps {
  bugs: Bug[];
  onSelectBug: (id: string) => void;
  onUpdateStatus: (id: string, status: BugStatus) => void;
}

const COLUMNS: { id: BugStatus; title: string; dotColor: string; count?: number }[] = [
  { id: "open", title: "Ouvert", dotColor: "bg-gray-400" },
  { id: "in_progress", title: "En cours", dotColor: "bg-blue-400" },
  { id: "resolved", title: "Résolu", dotColor: "bg-emerald-400" },
  { id: "closed", title: "Fermé", dotColor: "bg-purple-400" },
];

const getSeverityConfig = (severity: BugSeverity) => {
  switch (severity) {
    case "critical":
      return { label: "Critique", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: AlertOctagon, ring: "ring-rose-500/20" };
    case "high":
      return { label: "Élevé", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle, ring: "ring-amber-500/20" };
    case "medium":
      return { label: "Moyen", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: AlertCircle, ring: "ring-blue-500/20" };
    case "low":
      return { label: "Faible", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, ring: "ring-emerald-500/20" };
  }
};

export function BugKanbanBoard({ bugs, onSelectBug, onUpdateStatus }: BugKanbanBoardProps) {
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-1", "ring-white/10");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-1", "ring-white/10");
  };

  const handleDrop = (e: React.DragEvent, targetStatus: BugStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-1", "ring-white/10");
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      onUpdateStatus(id, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((column) => {
        const columnBugs = bugs.filter((b) => b.status === column.id);

        return (
          <div
            key={column.id}
            className="rounded-2xl border border-white/[0.04] bg-[#0d1117]/60 backdrop-blur-sm p-3 flex flex-col min-h-[480px] transition-all duration-300"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                <h3 className="text-[13px] font-semibold text-gray-300 tracking-tight">
                  {column.title}
                </h3>
              </div>
              <span className="text-[11px] font-medium text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">
                {columnBugs.length}
              </span>
            </div>

            {/* Bug Cards */}
            <div className="space-y-2 flex-1">
              <AnimatePresence mode="popLayout">
                {columnBugs.map((bug) => {
                  const severity = getSeverityConfig(bug.severity);
                  const SeverityIcon = severity.icon;

                  return (
                    <div
                      key={bug.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bug.id!)}
                    >
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
                        onClick={() => onSelectBug(bug.id!)}
                        className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#161b22]/80 hover:bg-[#1c2333] p-3.5 transition-all duration-200 cursor-pointer hover:border-white/[0.08] hover:shadow-lg hover:shadow-white/20 active:scale-[0.98]"
                      >
                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10">
                          {/* Title */}
                          <h4 className="text-[13px] font-semibold text-gray-200 group-hover:text-white transition-colors line-clamp-2 leading-snug mb-2">
                            {bug.title}
                          </h4>

                          {/* Description excerpt */}
                          {bug.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">
                              {bug.description.replace(/[#*`_]/g, "")}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04]">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${severity.bg} ${severity.color}`}>
                              <SeverityIcon className="w-3 h-3" />
                              {severity.label}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {bug.screenshotUrl && (
                                <Paperclip className="w-3 h-3 text-gray-600" />
                              )}
                              {bug.assignee ? (
                                <div
                                  className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-[9px] font-bold text-white flex items-center justify-center ring-1 ring-white/10"
                                  title={bug.assignee.name}
                                >
                                  {bug.assignee.avatarUrl ? (
                                    <Image src={bug.assignee.avatarUrl} alt={bug.assignee.name} width={20} height={20} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    bug.assignee.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                  )}
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-white/[0.04] text-gray-600 flex items-center justify-center ring-1 ring-white/[0.04]">
                                  <User className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>

              {columnBugs.length === 0 && (
                <div className="h-20 border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center">
                  <span className="text-[11px] text-gray-600 font-medium">Déposer ici</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
