"use client";

import type { Badge } from "@/lib/firebase/services/addictions";
import { motion } from "framer-motion";

interface AddictionBadgesProps {
  badges: Badge[];
}

export function AddictionBadges({ badges }: AddictionBadgesProps) {
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Badges
      </h3>
      
      {unlockedBadges.length === 0 && lockedBadges.length === 0 ? (
        <div className="text-center py-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Commencez votre parcours pour débloquer des badges !
          </p>
        </div>
      ) : (
        <>
          {unlockedBadges.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                Débloqués ({unlockedBadges.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {unlockedBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4 text-center hover:shadow-lg transition-all cursor-default"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                      {badge.name}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {badge.description}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {lockedBadges.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                À débloquer ({lockedBadges.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 p-4 text-center opacity-60"
                  >
                    <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
                    <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      {badge.name}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {badge.requirement} jours
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
