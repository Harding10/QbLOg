"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserNotes, getUserTags, createNote, updateNote, Note, Tag } from "@/lib/firebase/services/notes";
import { Plus, Search, Star, Clock, Bug, FileJson, Calendar as CalendarIcon, Tag as TagIcon, BookOpen, Sparkles, X, Check, ChevronDown } from "lucide-react";
import { TagBadge } from "@/components/ui/TagBadge";
import HamsterLoader from "@/components/ui/HamsterLoader";
import { useRouter } from "next/navigation";

export default function JournalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // États pour le modal de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<'bug' | 'api' | 'daily' | null>(null);
  const [selectedTagsForNewNote, setSelectedTagsForNewNote] = useState<string[]>([]);
  const [creatingNote, setCreatingNote] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [fetchedNotes, fetchedTags] = await Promise.all([
            getUserNotes(user.uid),
            getUserTags(user.uid)
          ]);
          setNotes(fetchedNotes);
          setTags(fetchedTags);
        } catch (error) {
          console.error("Error fetching notes or tags:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const toggleFavorite = async (noteId: string, currentStatus: boolean) => {
    try {
      await updateNote(noteId, { isFavorite: !currentStatus });
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isFavorite: !currentStatus } : n));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || creatingNote) return;

    setCreatingNote(true);

    let defaultContent = "";
    if (selectedTemplate === "daily") {
      defaultContent = `# Journal Quotidien - ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n## 🚀 Travail accompli aujourd'hui\n- \n\n## 💡 Apprentissages et découvertes\n- \n\n## 🚧 Obstacles et bloqueurs\n- \n\n## 🎯 Objectifs pour demain\n- `;
    } else if (selectedTemplate === "bug") {
      defaultContent = `# Post-Mortem de Bug : [Nom du Bug]\n\n## 🔍 Description du problème\n- **Symptôme :** \n- **Impact :** \n- **Date de détection :** \n\n## 🛠️ Investigation & Cause Racine\n- **Pourquoi cela s'est produit ?** \n- **Comment le bug a été identifié ?** \n\n## 🚀 Résolution & Actions Préventives\n- **Solution appliquée :** \n- **Comment éviter que cela ne se reproduise ?** `;
    } else if (selectedTemplate === "api") {
      defaultContent = `# Documentation API : \`[METHODE] /api/v1/resource\`\n\n## 📝 Description\n- \n\n## 📥 Paramètres de requête (Request)\n- \`param\` (Type, Requis) - Description\n\n## 📤 Corps de réponse (Response)\n\`\`\`json\n{\n  "success": true,\n  "data": {}\n}\n\`\`\``;
    } else {
      defaultContent = `# ${newNoteTitle.trim() || "Nouvelle Note"}\n\nÉcrivez ici...`;
    }

    try {
      const noteId = await createNote({
        title: newNoteTitle.trim() || "Note sans titre",
        content: defaultContent,
        isFavorite: false,
        templateType: selectedTemplate,
        userId: user.uid,
        tags: selectedTagsForNewNote
      });
      setIsCreateModalOpen(false);
      setNewNoteTitle("");
      setSelectedTemplate(null);
      setSelectedTagsForNewNote([]);
      router.push(`/journal/${noteId}`);
    } catch (error) {
      console.error("Erreur lors de la création de la note:", error);
    } finally {
      setCreatingNote(false);
    }
  };

  const toggleTagForNewNote = (tagId: string) => {
    setSelectedTagsForNewNote(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch = (note.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (note.content || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? note.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });

  const activeTag = tags.find(tag => tag.id === selectedTag);

  const getTemplateIcon = (type: Note['templateType']) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-rose-500" />;
      case 'api': return <FileJson className="w-4 h-4 text-blue-500" />;
      case 'daily': return <CalendarIcon className="w-4 h-4 text-emerald-500" />;
      default: return null;
    }
  };

  const templates = [
    { id: null, name: "Note classique", icon: <Sparkles className="w-5 h-5" />, desc: "Commencer avec une page blanche", border: "hover:border-indigo-500/50 dark:hover:border-indigo-400/50", selectedBg: "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400" },
    { id: 'daily', name: "Daily Tech Log", icon: <CalendarIcon className="w-5 h-5" />, desc: "Journal de dev et objectifs journaliers", border: "hover:border-emerald-500/50 dark:hover:border-emerald-400/50", selectedBg: "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400" },
    { id: 'bug', name: "Bug Post-mortem", icon: <Bug className="w-5 h-5" />, desc: "Analyser et documenter un bug résolu", border: "hover:border-rose-500/50 dark:hover:border-rose-400/50", selectedBg: "bg-rose-50/50 dark:bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400" },
    { id: 'api', name: "API Doc", icon: <FileJson className="w-5 h-5" />, desc: "Spécification d'endpoints d'API", border: "hover:border-blue-500/50 dark:hover:border-blue-400/50", selectedBg: "bg-blue-50/50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 px-5 md:px-12 pt-10 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white">Journal Tech</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vos notes de développement, post-mortems et documentations.</p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:scale-102 duration-200"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Note
        </Link>
      </header>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="relative w-full sm:w-60" ref={dropdownRef}>
          <button
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            className="flex items-center justify-between gap-2.5 w-full px-4 py-2.5 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              {activeTag ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeTag.color }} />
                  <span className="truncate">{activeTag.name}</span>
                </>
              ) : (
                <>
                  <TagIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Tous les tags</span>
                </>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isTagDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md dark:bg-dark-primary/95">
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setIsTagDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left font-medium cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  Tous les tags
                </span>
                {selectedTag === null && <Check className="w-4 h-4 text-primary-500" />}
              </button>
              
              {tags.length > 0 && <div className="border-t border-gray-100 dark:border-gray-800/80 my-1.5" />}
              
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTag(tag.id!);
                      setIsTagDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left font-medium cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="truncate">{tag.name}</span>
                    </span>
                    {selectedTag === tag.id && <Check className="w-4 h-4 text-primary-500 font-bold" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des Notes */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Aucune note trouvée</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Vous n'avez pas encore de note correspondant à vos critères de recherche.
          </p>
          <Link
            href="/journal/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors shadow-md"
          >
            Créer ma première note
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const dateObj = note.updatedAt?.seconds ? new Date(note.updatedAt.seconds * 1000) : new Date();
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
            
            const getCategoryLabel = (type: string) => {
              switch (type) {
                case 'bug': return 'Bug';
                case 'api': return 'API';
                case 'daily': return 'Daily';
                default: return 'Note';
              }
            };
            
            const getGradientClass = (id: string) => {
              const gradients = [
                'from-[#ff007a] via-[#7928ca] to-[#4f46e5]',
                'from-fuchsia-500 via-purple-600 to-indigo-700',
                'from-orange-500 via-rose-500 to-purple-600',
                'from-emerald-400 via-teal-500 to-cyan-600',
                'from-blue-600 via-indigo-600 to-violet-800',
                'from-amber-400 via-orange-500 to-rose-600',
                'from-purple-600 via-pink-600 to-red-500',
                'from-green-400 via-teal-500 to-indigo-600'
              ];
              
              if (!id) return gradients[0];
              let hash = 0;
              for (let i = 0; i < id.length; i++) {
                hash = id.charCodeAt(i) + ((hash << 5) - hash);
              }
              const index = Math.abs(hash) % gradients.length;
              return gradients[index];
            };

            const categoryLabel = getCategoryLabel(note.templateType || '');
            const gradientClass = getGradientClass(note.id || '');
            
            return (
              <div 
                key={note.id} 
                className="group w-full overflow-hidden rounded-[20px] bg-[#1b233d] p-1.5 shadow-[rgba(100,100,111,0.2)_0px_7px_20px_0px] transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-[1.03] cursor-pointer flex flex-col justify-between"
                onClick={() => router.push(`/journal/${note.id}`)}
              >
                {/* Top Section */}
                <div className={`relative flex h-[160px] flex-col items-start justify-between rounded-[15px] bg-gradient-to-r ${gradientClass} before:absolute before:left-0 before:top-[30px] before:h-[160px] before:w-[15px] before:bg-transparent before:rounded-tl-[15px] before:shadow-[-5px_-5px_0_2px_#1b233d]`}>
                  
                  {/* L'onglet en biais */}
                  <div className="relative h-[30px] w-[130px] -translate-x-[11.5px] -skew-x-[40deg] rounded-br-[10px] bg-[#1b233d] shadow-[-10px_-10px_0_0_#1b233d] before:absolute before:right-[-15px] before:top-0 before:h-[15px] before:w-[15px] before:bg-transparent before:rounded-tl-[10px] before:shadow-[-5px_-5px_0_2px_#1b233d]" />
                  
                  {/* Conteneur des icônes (redressé pour annuler le skew de l'onglet) */}
                  <div className="absolute top-0 flex h-[30px] w-full justify-between px-3.5 py-1.5 items-center">
                    {/* Logo/Catégorie */}
                    <div className="flex items-center gap-1.5 text-white z-10">
                      {note.templateType === 'bug' && <Bug className="w-3.5 h-3.5" />}
                      {note.templateType === 'api' && <FileJson className="w-3.5 h-3.5" />}
                      {note.templateType === 'daily' && <CalendarIcon className="w-3.5 h-3.5" />}
                      {!note.templateType && <BookOpen className="w-3.5 h-3.5" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">{categoryLabel}</span>
                    </div>
                    
                    {/* Favori Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id!, note.isFavorite); }}
                      className={`z-10 p-1 rounded-lg transition-all hover:scale-110 ${note.isFavorite ? 'text-amber-300' : 'text-white/60 hover:text-white'}`}
                    >
                      <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current text-amber-300' : ''}`} />
                    </button>
                  </div>

                  {/* Aperçu du contenu de la note */}
                  <div className="relative z-10 w-full px-4 pb-3 flex-1 flex flex-col justify-end">
                    <p className="text-white text-xs font-semibold leading-relaxed line-clamp-3 text-left drop-shadow-sm select-none opacity-90">
                      {(note.content || "").replace(/[#*`_]/g, '') || "Aucun contenu..."}
                    </p>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-4 px-1 py-2.5 flex-1 flex flex-col justify-between">
                  <span className="block text-center text-[15px] font-black uppercase tracking-[2.5px] text-white truncate max-w-full px-2 group-hover:text-primary-400 transition-colors">
                    {note.title || "NOTE SANS TITRE"}
                  </span>
                  
                  {/* Grille de stats */}
                  <div className="mt-5 flex justify-between items-center">
                    {/* Stat 1: Date */}
                    <div className="flex-1 text-center p-1.5 text-[rgba(170,222,243,0.72)]">
                      <span className="block text-[11px] font-bold text-white leading-none mb-1">{day} {month}</span>
                      <span className="text-[8px] uppercase tracking-wider">Modifié le</span>
                    </div>

                    {/* Stat 2: Modèle */}
                    <div className="flex-1 text-center p-1.5 text-[rgba(170,222,243,0.72)] border-x border-white/10">
                      <span className="block text-[11px] font-bold text-white capitalize leading-none mb-1 truncate max-w-[60px] mx-auto">{note.templateType || 'Standard'}</span>
                      <span className="text-[8px] uppercase tracking-wider">Modèle</span>
                    </div>

                    {/* Stat 3: Tag */}
                    <div className="flex-1 text-center p-1.5 text-[rgba(170,222,243,0.72)]">
                      <span className="block text-[11px] font-bold text-white truncate max-w-[60px] mx-auto leading-none mb-1">
                        {note.tags && note.tags.length > 0 ? `#${tags.find(t => t.id === note.tags[0])?.name || 'Tag'}` : 'Aucun'}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider">Tag</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Premium de Création */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-dark-primary rounded-3xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Créer une note</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Sélectionnez un modèle pour commencer</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Titre */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Titre de la note</label>
                <input 
                  required 
                  type="text" 
                  value={newNoteTitle} 
                  onChange={e => setNewNoteTitle(e.target.value)} 
                  placeholder="Ex: Refactoring de la base de données, Journal de bord..."
                  className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 transition-all font-medium"
                />
              </div>

              {/* Modèles */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Modèles de structure</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map(t => {
                    const isSelected = selectedTemplate === t.id;
                    return (
                      <div
                        key={t.id === null ? "null" : t.id}
                        onClick={() => setSelectedTemplate(t.id as "bug" | "api" | "daily" | null)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-28 ${t.border} ${
                          isSelected 
                            ? t.selectedBg + " ring-1 ring-offset-0 ring-primary-500/30 scale-101 shadow-sm font-semibold" 
                            : "bg-white dark:bg-dark-primary border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-50 dark:bg-white/5'}`}>
                            {t.icon}
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 dark:text-white">{t.name}</h4>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{t.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sélection des Tags */}
              {tags.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tags associés (facultatif)</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                      const isSelected = selectedTagsForNewNote.includes(tag.id!);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTagForNewNote(tag.id!)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all duration-200 ${
                            isSelected
                              ? "bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 font-bold"
                              : "bg-white dark:bg-dark-primary border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: tag.color }} 
                          />
                          {tag.name}
                          {isSelected && <Check className="w-3 h-3 text-primary-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pied de page Modal */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={creatingNote}
                  className="px-6 py-2.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {creatingNote ? "Création..." : "Créer et Éditer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
