"use client";

import type { AddictionStats } from "@/lib/firebase/services/addictions";
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  Flame,
  Target
} from "lucide-react";

interface AddictionStatsProps {
  stats: AddictionStats | null;
}

export function AddictionStats({ stats }: AddictionStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 bg-gray-50/50 dark:bg-white/1 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Jours suivis",
      value: stats.totalDays,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      title: "Jours réussis",
      value: stats.successfulDays,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      title: "Taux de réussite",
      value: `${stats.successRate}%`,
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    },
    {
      title: "Meilleur streak",
      value: stats.bestStreak,
      icon: Award,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 bg-white/60 dark:bg-dark-primary/40 backdrop-blur-md hover:shadow-lg transition-all"
        >
          <div className={`flex items-center gap-3 mb-3`}>
            <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.borderColor} border`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {card.title}
            </span>
          </div>
          <div className="text-3xl font-white text-gray-900 dark:text-white">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
