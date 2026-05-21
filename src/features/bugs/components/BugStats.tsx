"use client";

import { motion } from "framer-motion";
import { Bug, BugSeverity } from "@/lib/firebase/services/bugs";
import { AlertOctagon, CheckCircle2, CircleDot, Kanban, TrendingUp, Zap } from "lucide-react";

interface BugStatsProps {
  bugs: Bug[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, damping: 20, stiffness: 150 } }
};

export function BugStats({ bugs }: BugStatsProps) {
  const total = bugs.length;
  const active = bugs.filter((b) => b.status === "open" || b.status === "in_progress").length;
  const resolved = bugs.filter((b) => b.status === "resolved" || b.status === "closed").length;
  const critical = bugs.filter((b) => b.severity === "critical").length;
  const high = bugs.filter((b) => b.severity === "high").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const stats = [
    {
      label: "Total Bugs",
      value: total,
      subtitle: `${active} actifs`,
      icon: Kanban,
      gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
      glow: "shadow-violet-500/5",
      accent: "text-violet-400",
    },
    {
      label: "Tickets Actifs",
      value: active,
      subtitle: `${critical} critiques · ${high} élevés`,
      icon: Zap,
      gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
      glow: "shadow-amber-500/5",
      accent: "text-amber-400",
    },
    {
      label: "Taux Résolution",
      value: `${resolutionRate}%`,
      subtitle: `${resolved} résolus sur ${total}`,
      icon: TrendingUp,
      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
      glow: "shadow-emerald-500/5",
      accent: "text-emerald-400",
      progressBar: true,
      progress: resolutionRate,
    },
    {
      label: "Bugs Résolus",
      value: resolved,
      subtitle: `sur ${total} signalés`,
      icon: CheckCircle2,
      gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      iconBg: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",
      glow: "shadow-cyan-500/5",
      accent: "text-cyan-400",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={item}
          className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-[#0d1117] ${stat.glow} hover:shadow-lg cursor-default`}
        >
          {/* Gradient background glow */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                {stat.label}
              </span>
              <div className={`p-2 rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>

            <div className={`text-3xl font-black tracking-tight text-white mb-1`}>
              {stat.value}
            </div>

            <p className="text-[11px] text-gray-500 font-medium">
              {stat.subtitle}
            </p>

            {stat.progressBar && (
              <div className="mt-3 w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
