"use client";

import { useState, useMemo } from "react";
import type { AddictionEntry } from "@/lib/firebase/services/addictions";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AddictionCalendarProps {
  entries: AddictionEntry[];
  onDateClick: (date: string) => void;
}

export function AddictionCalendar({ entries, onDateClick }: AddictionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const entriesByDate = useMemo(() => {
    const map: Record<string, AddictionEntry> = {};
    entries.forEach(entry => {
      map[entry.date] = entry;
    });
    return map;
  }, [entries]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayStatus = (date: string) => {
    const entry = entriesByDate[date];
    if (!entry) return null;
    return entry.status;
  };

  const renderCalendarDays = () => {
    const days = [];
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    // Day names header
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
    );

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = getDayStatus(date);
      const isToday = date === today;

      let bgColor = "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10";
      let textColor = "text-gray-700 dark:text-gray-300";

      if (status === 'success') {
        bgColor = "bg-green-500 hover:bg-green-600";
        textColor = "text-white";
      } else if (status === 'failure') {
        bgColor = "bg-red-500 hover:bg-red-600";
        textColor = "text-white";
      }

      days.push(
        <button
          key={day}
          onClick={() => onDateClick(date)}
          className={`
            aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all
            ${bgColor} ${textColor}
            ${isToday ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-primary' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 bg-white/60 dark:bg-dark-primary/40 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            Aujourd'hui
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Réussi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Échec</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-white/5" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Non renseigné</span>
        </div>
      </div>
    </div>
  );
}
