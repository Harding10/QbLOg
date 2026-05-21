"use client";

import { BugActivity } from "@/lib/firebase/services/bugs";
import { Activity, Clock, PlusCircle, RefreshCw, Star, UserPlus, Image as ImageIcon, MessageCircle } from "lucide-react";

interface BugTimelineProps {
  activities: BugActivity[];
}

export function BugTimeline({ activities }: BugTimelineProps) {
  const getActivityIcon = (type: BugActivity["type"]) => {
    switch (type) {
      case "create":
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case "status_change":
        return <RefreshCw className="w-3.5 h-3.5 text-blue-500" />;
      case "priority_change":
        return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case "assignee_change":
        return <UserPlus className="w-3.5 h-3.5 text-purple-500" />;
      case "comment_add":
        return <MessageCircle className="w-3.5 h-3.5 text-cyan-500" />;
      case "screenshot_add":
        return <ImageIcon className="w-3.5 h-3.5 text-pink-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const formatActivityTime = (timestamp: any) => {
    if (!timestamp) return "Récemment";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Format friendly relative time (e.g., "Il y a 5 min" or "Le 21 mai à 14:32")
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">
        Aucune activité enregistrée.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id || activityIdx}>
            <div className="relative pb-6">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3 items-start">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 flex items-center justify-center ring-8 ring-white dark:ring-dark-primary">
                    {getActivityIcon(activity.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {activity.userName}
                      </span>{" "}
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right text-[10px] whitespace-nowrap text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatActivityTime(activity.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
