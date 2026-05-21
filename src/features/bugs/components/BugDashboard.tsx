"use client";

import { useBugs } from "../hooks/useBugs";
import { BugStats } from "./BugStats";
import { BugKanbanBoard } from "./BugKanbanBoard";
import { BugTable } from "./BugTable";
import { BugFormModal } from "./BugFormModal";
import { BugDetailDrawer } from "./BugDetailDrawer";
import { BugCommandPalette } from "./BugCommandPalette";
import { 
  Bug as BugIcon, 
  Search, 
  Plus, 
  Grid, 
  List, 
  Command, 
  Filter,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  CircleDot
} from "lucide-react";
import React, { useEffect } from "react";

export function BugDashboard() {
  const {
    bugs,
    filteredBugs,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    view,
    setView,
    selectedBugId,
    setSelectedBugId,
    selectedBug,
    showFormModal,
    setShowFormModal,
    editBugId,
    setEditBugId,
    commandPaletteOpen,
    setCommandPaletteOpen,
    comments,
    activities,
    detailLoading,
    handleCreateBug,
    handleUpdateBug,
    handleDeleteBug,
    handleAddComment,
    handleDeleteComment,
  } = useBugs();

  // Listen to keyboard shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  const activeBugsCount = bugs.filter(b => b.status === "open" || b.status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
            Suivi des Bugs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez, priorisez et résolvez les anomalies de vos applications en équipe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cmd + K Badge */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Rechercher</span>
            <kbd className="bg-gray-150 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold">⌘K</kbd>
          </button>

          {/* New Bug Button */}
          <button
            onClick={() => {
              setEditBugId(null);
              setShowFormModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau ticket</span>
          </button>
        </div>
      </header>

      {/* Analytics Dashboard */}
      <BugStats bugs={bugs} />

      {/* Toolbar (Filters, Search, View Switcher) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white/60 dark:bg-dark-primary/40 backdrop-blur-md">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un bug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="open">Ouverts</option>
              <option value="in_progress">En Cours</option>
              <option value="resolved">Résolus</option>
              <option value="closed">Fermés</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les priorités</option>
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
              <option value="critical">Critique</option>
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5 w-full sm:w-auto shrink-0 justify-center">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === "kanban"
                ? "bg-white dark:bg-dark-primary text-primary-500 dark:text-primary-400 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Tableau</span>
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === "table"
                ? "bg-white dark:bg-dark-primary text-primary-500 dark:text-primary-400 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Liste</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      {loading ? (
        // Skeleton Loader
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-4 min-h-[400px] bg-gray-50/50 dark:bg-white/1 animate-pulse space-y-4">
              <div className="h-6 bg-gray-250 dark:bg-white/5 rounded-lg w-1/2" />
              <div className="h-24 bg-gray-200 dark:bg-white/5 rounded-xl w-full" />
              <div className="h-24 bg-gray-200 dark:bg-white/5 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredBugs.length === 0 ? (
        // Premium Empty State
        <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/2 max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <BugIcon className="w-7 h-7 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-gray-850 dark:text-gray-200 mb-2">Aucun ticket trouvé</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 text-sm leading-relaxed">
            {bugs.length === 0
              ? "Tout semble fonctionner parfaitement ! Aucun bug n'a été signalé pour l'instant."
              : "Aucun bug ne correspond à vos critères de recherche ou filtres appliqués."}
          </p>
          {bugs.length === 0 ? (
            <button
              onClick={() => {
                setEditBugId(null);
                setShowFormModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer le premier ticket</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="text-sm font-bold text-primary-500 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : view === "kanban" ? (
        <BugKanbanBoard
          bugs={filteredBugs}
          onSelectBug={setSelectedBugId}
          onUpdateStatus={(id, status) => handleUpdateBug(id, { status })}
        />
      ) : (
        <BugTable
          bugs={filteredBugs}
          onSelectBug={setSelectedBugId}
          onDeleteBug={handleDeleteBug}
        />
      )}

      {/* Command Palette */}
      <BugCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        bugs={bugs}
        onSelectBug={setSelectedBugId}
        onOpenCreateModal={() => {
          setEditBugId(null);
          setShowFormModal(true);
        }}
        onChangeView={setView}
        onSetPriorityFilter={setPriorityFilter}
        onSetStatusFilter={setStatusFilter}
      />

      {/* Form Modal (Create & Edit) */}
      <BugFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditBugId(null);
        }}
        onSubmit={async (data) => {
          if (editBugId) {
            await handleUpdateBug(editBugId, data);
            setShowFormModal(false);
            setEditBugId(null);
          } else {
            await handleCreateBug(data);
          }
        }}
        editBug={editBugId ? bugs.find(b => b.id === editBugId) : null}
      />

      {/* Detail Drawer */}
      <BugDetailDrawer
        isOpen={selectedBugId !== null}
        onClose={() => setSelectedBugId(null)}
        bug={selectedBug}
        comments={comments}
        activities={activities}
        detailLoading={detailLoading}
        onUpdateBug={handleUpdateBug}
        onDeleteBug={handleDeleteBug}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onOpenEditModal={() => {
          if (selectedBugId) {
            setEditBugId(selectedBugId);
            setShowFormModal(true);
          }
        }}
      />
    </div>
  );
}
