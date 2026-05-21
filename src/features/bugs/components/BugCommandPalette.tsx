"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bug, BugStatus, BugSeverity } from "@/lib/firebase/services/bugs";
import { Search, Plus, List, Grid, RotateCcw, AlertTriangle, Bug as BugIcon, Command } from "lucide-react";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface BugCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bugs: Bug[];
  onSelectBug: (id: string) => void;
  onOpenCreateModal: () => void;
  onChangeView: (view: "kanban" | "table") => void;
  onSetPriorityFilter: (priority: BugSeverity | "all") => void;
  onSetStatusFilter: (status: BugStatus | "all") => void;
}

export function BugCommandPalette({
  isOpen,
  onClose,
  bugs,
  onSelectBug,
  onOpenCreateModal,
  onChangeView,
  onSetPriorityFilter,
  onSetStatusFilter
}: BugCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle command palette on Ctrl+K or Cmd+K
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const searchResults = React.useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();

    // Standard commands
    const commands: SearchResult[] = [
      { id: "cmd-create", type: "command", title: "Créer un nouveau ticket de bug", icon: <Plus className="w-4 h-4 text-emerald-500" />, action: () => { onOpenCreateModal(); onClose(); } },
      { id: "cmd-view-kanban", type: "command", title: "Afficher le tableau Kanban", icon: <Grid className="w-4 h-4 text-blue-500" />, action: () => { onChangeView("kanban"); onClose(); } },
      { id: "cmd-view-table", type: "command", title: "Afficher la liste/table", icon: <List className="w-4 h-4 text-purple-500" />, action: () => { onChangeView("table"); onClose(); } },
      { id: "cmd-filter-crit", type: "command", title: "Filtrer : Priorité Critique", icon: <AlertTriangle className="w-4 h-4 text-rose-500" />, action: () => { onSetPriorityFilter("critical"); onClose(); } },
      { id: "cmd-filter-reset", type: "command", title: "Réinitialiser tous les filtres", icon: <RotateCcw className="w-4 h-4 text-gray-500" />, action: () => { onSetPriorityFilter("all"); onSetStatusFilter("all"); onClose(); } }
    ];

    // Filtered commands
    const filteredCommands = commands.filter(c => c.title.toLowerCase().includes(q));

    // Matching bugs
    const matchingBugs: SearchResult[] = q.length > 0 
      ? bugs
          .filter(b => b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
          .map(b => ({
            id: `bug-${b.id}`,
            type: "bug",
            title: b.title,
            subtitle: b.description ? b.description.slice(0, 50) + "..." : "",
            icon: <BugIcon className="w-4 h-4 text-amber-500" />,
            action: () => { onSelectBug(b.id!); onClose(); }
          }))
          .slice(0, 5)
      : [];

    return [...filteredCommands, ...matchingBugs];
  }, [query, bugs, onOpenCreateModal, onChangeView, onSetPriorityFilter, onSetStatusFilter, onSelectBug, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="bg-white dark:bg-[#131b2e] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[50vh]">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-150 dark:border-gray-800 px-4 py-3 bg-gray-50/50 dark:bg-black/10">
          <Search className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un ticket ou exécuter une commande..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-850 dark:text-white placeholder-gray-400 border-none outline-none text-sm font-medium py-1"
          />
          <div className="flex items-center gap-0.5 text-[10px] text-gray-400 font-bold border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 rounded-md px-1.5 py-0.5 shadow-sm">
            <Command className="w-2.5 h-2.5" /> ESC
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
          {searchResults.length > 0 ? (
            searchResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary-500/10 dark:bg-primary-500/20 text-primary-500 dark:text-primary-400 font-semibold scale-[1.01]"
                      : "text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/2"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs truncate block leading-tight">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-gray-450 dark:text-gray-500 truncate block mt-0.5 font-normal">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] uppercase tracking-wider text-primary-500 dark:text-primary-400 font-black">
                      Entrée
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-gray-450 dark:text-gray-500">
              Aucun résultat trouvé pour "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
