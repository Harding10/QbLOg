"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserBugs, createBug, updateBugStatus, deleteBug, Bug, BugStatus, BugSeverity } from "@/lib/firebase/services/bugs";
import { Plus, AlertCircle, AlertTriangle, AlertOctagon, CheckCircle2, Trash2 } from "lucide-react";

const COLUMNS: { id: BugStatus; title: string; color: string }[] = [
  { id: "open", title: "Ouverts", color: "bg-gray-50 dark:bg-dark-primary/50 border-gray-200 dark:border-gray-800" },
  { id: "in_progress", title: "En Cours", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30" },
  { id: "resolved", title: "Résolus", color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30" },
];

export default function BugsPage() {
  const { user } = useAuth();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBugModal, setShowNewBugModal] = useState(false);
  const [newBug, setNewBug] = useState({ title: "", description: "", severity: "medium" as BugSeverity });

  const fetchBugs = async () => {
    if (user) {
      const fetchedBugs = await getUserBugs(user.uid);
      setBugs(fetchedBugs);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [user]);

  const handleCreateBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newBug.title) return;
    
    await createBug({
      title: newBug.title,
      description: newBug.description,
      severity: newBug.severity,
      status: "open",
      userId: user.uid
    });
    
    setShowNewBugModal(false);
    setNewBug({ title: "", description: "", severity: "medium" });
    fetchBugs();
  };

  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    // Optimistic UI update
    setBugs(bugs.map(b => b.id === bugId ? { ...b, status: newStatus } : b));
    await updateBugStatus(bugId, newStatus);
  };

  const handleDelete = async (bugId: string) => {
    if (confirm("Supprimer ce bug ?")) {
      setBugs(bugs.filter(b => b.id !== bugId));
      await deleteBug(bugId);
    }
  };

  const getSeverityIcon = (severity: BugSeverity) => {
    switch (severity) {
      case 'low': return <span title="Basse"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>;
      case 'medium': return <span title="Moyenne"><AlertCircle className="w-4 h-4 text-blue-500" /></span>;
      case 'high': return <span title="Haute"><AlertTriangle className="w-4 h-4 text-amber-500" /></span>;
      case 'critical': return <span title="Critique"><AlertOctagon className="w-4 h-4 text-rose-500" /></span>;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div></div>;

  return (
    <div className="space-y-6 px-5 md:px-12 pt-10 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Suivi des Bugs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez et résolvez vos tickets.</p>
        </div>
        <button
          onClick={() => setShowNewBugModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <Plus className="w-5 h-5" />
          Signaler un Bug
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMNS.map((column) => (
          <div key={column.id} className={`rounded-2xl p-4 min-h-[500px] border ${column.color}`}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
              {column.title}
              <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white text-xs py-1 px-2 rounded-full border border-gray-300 dark:border-white/5">
                {bugs.filter(b => b.status === column.id).length}
              </span>
            </h2>
            
            <div className="space-y-3">
              {bugs.filter(b => b.status === column.id).map(bug => (
                <div key={bug.id} className="bg-white dark:bg-dark-primary p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-primary-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-primary-500 transition-colors">{bug.title}</h3>
                    {getSeverityIcon(bug.severity)}
                  </div>
                  {bug.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{bug.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <select
                      value={bug.status}
                      onChange={(e) => handleStatusChange(bug.id!, e.target.value as BugStatus)}
                      className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-primary-500"
                    >
                      {COLUMNS.map(c => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-dark-primary">{c.title}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => handleDelete(bug.id!)}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showNewBugModal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-primary rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Nouveau Bug</h2>
            <form onSubmit={handleCreateBug} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                <input required type="text" value={newBug.title} onChange={e => setNewBug({...newBug, title: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={3} value={newBug.description} onChange={e => setNewBug({...newBug, description: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 resize-none focus:border-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sévérité</label>
                <select value={newBug.severity} onChange={e => setNewBug({...newBug, severity: e.target.value as BugSeverity})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none">
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowNewBugModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
