"use client";

import { motion } from "framer-motion";
import { Sparkles, Heart, Flame } from "lucide-react";

interface MotivationalMessageProps {
  message: string;
}

export function MotivationalMessage({ message }: MotivationalMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-purple-500/5 p-6 backdrop-blur-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="p-3 rounded-xl bg-primary-500/20"
          >
            <Sparkles className="w-6 h-6 text-primary-500" />
          </motion.div>
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
