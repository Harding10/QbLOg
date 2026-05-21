"use client";

import { Bug, BugStatus, BugSeverity } from "@/lib/firebase/services/bugs";
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle2, Eye, Trash2, User } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface BugTableProps {
  bugs: Bug[];
  onSelectBug: (id: string) => void;
  onDeleteBug: (id: string) => void;
}

const getSeverityConfig = (severity: BugSeverity) => {
  switch (severity) {
    case "critical":
      return { label: "Critique", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: AlertOctagon };
    case "high":
      return { label: "Élevé", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle };
    case "medium":
      return { label: "Moyen", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: AlertCircle };
    case "low":
      return { label: "Faible", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 };
  }
};

const getStatusConfig = (status: BugStatus) => {
  switch (status) {
    case "open":
      return { label: "Ouvert", dot: "bg-gray-400", text: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" };
    case "in_progress":
      return { label: "En cours", dot: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
    case "resolved":
      return { label: "Résolu", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
    case "closed":
      return { label: "Fermé", dot: "bg-purple-400", text: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" };
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "Récent";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export function BugTable({ bugs, onSelectBug, onDeleteBug }: BugTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full overflow-hidden rounded-2xl border border-white/[0.04] bg-[#0d1117]/60 backdrop-blur-xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Ticket</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Statut</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Priorité</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Assigné</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Date</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bugs.map((bug, index) => {
              const severity = getSeverityConfig(bug.severity);
              const status = getStatusConfig(bug.status);
              const SeverityIcon = severity.icon;

              return (
                <motion.tr
                  key={bug.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => onSelectBug(bug.id!)}
                >
                  {/* Title */}
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="text-[13px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate block">
                      {bug.title}
                    </span>
                    {bug.description && (
                      <span className="text-[11px] text-gray-600 truncate block mt-0.5">
                        {bug.description.replace(/[#*`_]/g, "").slice(0, 60)}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold border ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${severity.bg} ${severity.color}`}>
                      <SeverityIcon className="w-3 h-3" />
                      {severity.label}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="px-5 py-3.5">
                    {bug.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 text-[9px] font-bold text-white flex items-center justify-center ring-1 ring-white/10">
                          {bug.assignee.avatarUrl ? (
                            <Image src={bug.assignee.avatarUrl} alt={bug.assignee.name} width={24} height={24} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            bug.assignee.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <span className="text-[12px] text-gray-400 font-medium">{bug.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> —
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-[12px] text-gray-500 font-medium">
                    {formatDate(bug.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelectBug(bug.id!)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBug(bug.id!)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
