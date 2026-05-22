"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserSnippets, createSnippet, deleteSnippet, Snippet } from "@/lib/firebase/services/snippets";
import { Plus, Code2, Copy, Trash2, Check, Search } from "lucide-react";

export default function VaultPage() {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newSnippet, setNewSnippet] = useState({ title: "", language: "typescript", code: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSnippets = async () => {
    if (user) {
      const fetched = await getUserSnippets(user.uid);
      setSnippets(fetched);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSnippet.title || !newSnippet.code) return;
    
    await createSnippet({
      title: newSnippet.title,
      language: newSnippet.language,
      code: newSnippet.code,
      userId: user.uid
    });
    
    setShowNewModal(false);
    setNewSnippet({ title: "", language: "typescript", code: "" });
    fetchSnippets();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce snippet ?")) {
      setSnippets(snippets.filter(s => s.id !== id));
      await deleteSnippet(id);
    }
  };

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div></div>;

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto space-y-6 px-5 md:px-12 pt-10 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Code Vault</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Votre bibliothèque de snippets réutilisables.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un snippet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" />
            Nouveau
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSnippets.map((snippet) => (
          <div 
            key={snippet.id} 
            className="bg-white dark:bg-dark-primary rounded-2xl border border-gray-200 dark:border-gray-800 p-5 group hover:border-primary-500/50 transition-all shadow-sm flex flex-col h-[300px]"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-primary-500 transition-colors">{snippet.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/5">{snippet.language}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(snippet.id!, snippet.code)} className="p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  {copiedId === snippet.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(snippet.id!)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/50 rounded-xl p-4 overflow-y-auto flex-1 border border-gray-200 dark:border-gray-800">
              <pre className="text-sm text-gray-800 dark:text-gray-300 font-mono">
                <code>{snippet.code}</code>
              </pre>
            </div>
          </div>
        ))}

        {filteredSnippets.length === 0 && (
          <div className="col-span-full text-center py-16 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5">
            <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-2">Aucun snippet</h3>
            <p className="text-gray-500 dark:text-gray-400">Sauvegardez vos morceaux de code les plus utiles ici.</p>
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-primary rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Nouveau Snippet</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                  <input required type="text" value={newSnippet.title} onChange={e => setNewSnippet({...newSnippet, title: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Langage</label>
                  <input required type="text" placeholder="Ex: typescript, bash, css..." value={newSnippet.language} onChange={e => setNewSnippet({...newSnippet, language: e.target.value})} className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <textarea required rows={8} value={newSnippet.code} onChange={e => setNewSnippet({...newSnippet, code: e.target.value})} className="w-full rounded-xl bg-gray-50 dark:bg-white/50 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 font-mono text-sm focus:border-primary-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
