"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { TagBadge, stringToColor } from "@/components/ui/TagBadge";
import { 
  getNote, 
  createNote, 
  updateNote, 
  deleteNote, 
  getUserTags, 
  createTag, 
  Note, 
  Tag 
} from "@/lib/firebase/services/notes";
import { ArrowLeft, Save, Trash2, Star, Tag as TagIcon, Plus, X, Bug, FileJson, Calendar as CalendarIcon, Sparkles, Clock } from "lucide-react";

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const isNewNote = resolvedParams.id === "new";
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(!isNewNote);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Partial<Note>>({
    title: "",
    content: "",
    isFavorite: false,
    templateType: null,
    tags: []
  });
  
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagMenu, setShowTagMenu] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      try {
        const tags = await getUserTags(user.uid);
        setUserTags(tags);

        if (!isNewNote) {
          const fetchedNote = await getNote(resolvedParams.id);
          if (fetchedNote && fetchedNote.userId === user.uid) {
            setNote(fetchedNote);
          } else {
            router.push("/journal");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, resolvedParams.id, isNewNote, router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (isNewNote) {
        const noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
          title: note.title || "Nouvelle Note",
          content: note.content || "",
          isFavorite: note.isFavorite || false,
          templateType: note.templateType || null,
          userId: user.uid,
          tags: note.tags || []
        };
        await createNote(noteData);
      } else {
        await updateNote(resolvedParams.id, {
          title: note.title,
          content: note.content,
          isFavorite: note.isFavorite,
          tags: note.tags
        });
      }
      
      // Redirection vers le journal tech dans tous les cas
      router.push("/journal");
    } catch (error) {
      console.error("Error saving note:", error);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
      try {
        await deleteNote(resolvedParams.id);
        router.push("/journal");
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  const handleAddExistingTag = (tagId: string) => {
    if (!note.tags?.includes(tagId)) {
      setNote(prev => ({ ...prev, tags: [...(prev.tags || []), tagId] }));
    }
    setShowTagMenu(false);
  };

  const handleCreateNewTag = async () => {
    if (!user || !newTagInput.trim()) return;
    const tagName = newTagInput.trim();
    
    const existing = userTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (existing) {
      handleAddExistingTag(existing.id!);
      setNewTagInput("");
      return;
    }

    try {
      const newTagData = {
        name: tagName,
        color: stringToColor(tagName),
        userId: user.uid
      };
      const created = await createTag(newTagData);
      setUserTags([...userTags, created as Tag]);
      handleAddExistingTag(created.id!);
      setNewTagInput("");
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags?.filter(id => id !== tagId) || []
    }));
  };

  const getStats = () => {
    const content = note.content || "";
    const words = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingTime };
  };

  const getTemplateBadge = (type: Note['templateType']) => {
    switch (type) {
      case 'bug': return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-500/20">
          <Bug className="w-3.5 h-3.5 text-rose-500" />
          Bug Post-mortem
        </div>
      );
      case 'api': return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20">
          <FileJson className="w-3.5 h-3.5 text-blue-500" />
          API Doc
        </div>
      );
      case 'daily': return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" />
          Daily Tech Log
        </div>
      );
      default: return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-800">
          <Sparkles className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          Note Classique
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-5 pt-10 pb-32">
      {/* Top bar (Header) */}
      <div className="flex items-center justify-between bg-white dark:bg-dark-primary p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <Link 
          href="/journal"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au journal
        </Link>
        <div className="flex items-center gap-2">
          {!isNewNote && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-xl transition-colors"
              title="Supprimer la note"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setNote({ ...note, isFavorite: !note.isFavorite })}
            className={`p-2 rounded-xl transition-colors ${
              note.isFavorite 
                ? "text-amber-400 bg-amber-50 dark:bg-amber-400/10 hover:bg-amber-100 dark:hover:bg-amber-400/20" 
                : "text-gray-400 hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
            title={note.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star className={`w-5 h-5 ${note.isFavorite ? "fill-amber-400" : ""}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Left column (Editor & Title) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-primary rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-6 shadow-sm w-full">
            <input
              type="text"
              value={note.title || ""}
              onChange={(e) => setNote({ ...note, title: e.target.value })}
              placeholder="Titre de la note..."
              className="w-full bg-transparent text-3xl font-extrabold text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 border-none outline-none focus:ring-0 p-0"
            />

            {/* Section Tags */}
            <div className="flex flex-wrap gap-2 items-center relative py-2 border-t border-b border-gray-100 dark:border-gray-800/40">
              <TagIcon className="w-4 h-4 text-gray-400" />
              
              {note.tags?.map(tagId => {
                const tag = userTags.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <TagBadge 
                    key={tag.id} 
                    name={tag.name} 
                    color={tag.color} 
                    onRemove={() => handleRemoveTag(tag.id!)} 
                  />
                );
              })}

              <div className="relative">
                <button
                  onClick={() => setShowTagMenu(!showTagMenu)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter tag
                </button>

                {showTagMenu && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex gap-2 bg-gray-50 dark:bg-black/20">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateNewTag();
                          }
                        }}
                        placeholder="Nouveau tag..."
                        className="w-full bg-white dark:bg-transparent text-sm text-gray-800 dark:text-white px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary-500"
                      />
                      <button 
                        onClick={handleCreateNewTag}
                        className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                      {userTags.filter(t => !note.tags?.includes(t.id!)).map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleAddExistingTag(tag.id!)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </button>
                      ))}
                      {userTags.filter(t => !note.tags?.includes(t.id!)).length === 0 && (
                        <p className="text-xs text-gray-400 p-2 text-center">Aucun autre tag existant.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <MarkdownEditor
              value={note.content || ""}
              onChange={(val) => setNote({ ...note, content: val })}
              minHeight="550px"
            />
          </div>
        </div>


      </div>
    </div>
  );
}
