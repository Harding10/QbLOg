"use client";

import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface AddictionStreakProps {
  currentStreak: number;
  bestStreak: number;
}

export function AddictionStreak({ currentStreak, bestStreak }: AddictionStreakProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "from-purple-500 to-pink-500";
    if (streak >= 14) return "from-orange-500 to-red-500";
    if (streak >= 7) return "from-yellow-500 to-orange-500";
    if (streak >= 3) return "from-green-500 to-emerald-500";
    return "from-gray-500 to-gray-600";
  };

  const getStreakSize = (streak: number) => {
    if (streak >= 100) return "text-6xl";
    if (streak >= 30) return "text-5xl";
    if (streak >= 7) return "text-4xl";
    return "text-3xl";
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 bg-gradient-to-br from-white/60 to-white/40 dark:from-dark-primary/40 dark:to-dark-primary/20 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Série actuelle
          </h3>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Flame className={`w-8 h-8 bg-gradient-to-br ${getStreakColor(currentStreak)} bg-clip-text text-transparent`} />
            </motion.div>
            <span className={`${getStreakSize(currentStreak)} font-black text-gray-900 dark:text-white`}>
              {currentStreak}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              jour{currentStreak > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Record personnel
          </h3>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {bestStreak}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              jour{bestStreak > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {currentStreak > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentStreak / bestStreak) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full bg-gradient-to-r ${getStreakColor(currentStreak)} rounded-full`}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {currentStreak >= bestStreak 
              ? "🎉 Nouveau record !" 
              : `${Math.round((currentStreak / bestStreak) * 100)}% de votre record`}
          </p>
        </div>
      )}
    </div>
  );
}
