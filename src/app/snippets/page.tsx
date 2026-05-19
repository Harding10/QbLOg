"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Plus, 
  Filter, 
  Copy, 
  MoreHorizontal, 
  Sparkles, 
  Loader2, 
  Trash2, 
  Edit3, 
  Code2, 
  Terminal, 
  Check, 
  HelpCircle, 
  Clock, 
  Zap, 
  Info 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore"
import { aiCodeOptimizer } from "@/ai/flows/ai-code-optimizer"

const LANGUAGES = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "sql", label: "SQL" },
  { id: "shell", label: "Bash / Shell" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "json", label: "JSON" },
]

export default function SnippetsPage() {
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const [search, setSearch] = React.useState("")
  const [selectedLanguageFilter, setSelectedLanguageFilter] = React.useState<string>("all")
  const [optimizing, setOptimizing] = React.useState<string | null>(null)
  
  const [isAdding, setIsAdding] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [snippetToDelete, setSnippetToDelete] = React.useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = React.useState("")
  const [code, setCode] = React.useState("")
  const [language, setLanguage] = React.useState("typescript")
  const [tags, setTags] = React.useState("")

  // AI Suggestion State
  const [aiSuggestion, setAiSuggestion] = React.useState<any | null>(null)
  const [aiSuggestionOpen, setAiSuggestionOpen] = React.useState(false)

  // Firestore Query
  const q = React.useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "snippets"),
      where("userId", "==", user.uid)
    )
  }, [db, user])

  const { data: rawSnippets, loading } = useCollection<any>(q)

  const snippets = React.useMemo(() => {
    if (!rawSnippets) return []
    return [...rawSnippets].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [rawSnippets])

  const handleCopy = (codeText: string) => {
    navigator.clipboard.writeText(codeText)
    toast({
      title: "Copié !",
      description: "Le code a été copié dans votre presse-papier."
    })
  }

  const resetForm = () => {
    setTitle("")
    setCode("")
    setLanguage("typescript")
    setTags("")
    setIsEditing(false)
    setIsAdding(false)
    setIsSaving(false)
    setSelectedId(null)
  }

  const startEditing = (snippet: any) => {
    setTitle(snippet.title || "")
    setCode(snippet.code || "")
    setLanguage(snippet.language || "typescript")
    setTags(snippet.tags?.join(", ") || "")
    setSelectedId(snippet.id)
    setIsEditing(true)
    setIsAdding(true)
  }

  const handleSave = () => {
    if (!db || !user) return
    if (!title.trim() || !code.trim()) {
      toast({ variant: "destructive", title: "Champs requis", description: "Le titre et le code sont obligatoires." })
      return
    }

    setIsSaving(true)
    const baseData = {
      title: title.trim(),
      code: code.trim(),
      language: language,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      userId: user.uid,
      updatedAt: serverTimestamp()
    }

    if (isEditing && selectedId) {
      updateDoc(doc(db, "snippets", selectedId), baseData)
        .then(() => {
          toast({ title: "Extrait de code mis à jour" })
          resetForm()
        })
        .catch(() => {
          setIsSaving(false)
          toast({ variant: "destructive", title: "Erreur de mise à jour" })
        })
    } else {
      const newData = { ...baseData, createdAt: serverTimestamp() }
      addDoc(collection(db, "snippets"), newData)
        .then(() => {
          toast({ title: "Nouvel extrait enregistré" })
          resetForm()
        })
        .catch(() => {
          setIsSaving(false)
          toast({ variant: "destructive", title: "Erreur de création" })
        })
    }
  }

  const confirmDelete = () => {
    if (!db || !snippetToDelete) return
    deleteDoc(doc(db, "snippets", snippetToDelete))
      .then(() => {
        toast({ title: "Extrait supprimé" })
        setSnippetToDelete(null)
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Erreur de suppression" })
      })
  }

  const handleOptimize = async (snippet: any) => {
    setOptimizing(snippet.id)
    try {
      const result = await aiCodeOptimizer({ 
        codeSnippet: snippet.code,
        context: "L'utilisateur souhaite améliorer les performances, la sécurité et la lisibilité du code."
      })
      setAiSuggestion({ snippetId: snippet.id, ...result })
      setAiSuggestionOpen(true)
      toast({
        title: "Suggestion IA générée",
        description: "Découvrez les pistes de refactoring proposées."
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "L'assistant IA est temporairement indisponible."
      })
    } finally {
      setOptimizing(null)
    }
  }

  const applyAiSuggestion = (optimizedCode: string) => {
    if (!db || !aiSuggestion) return
    const id = aiSuggestion.snippetId
    updateDoc(doc(db, "snippets", id), {
      code: optimizedCode,
      updatedAt: serverTimestamp()
    })
      .then(() => {
        toast({ title: "Optimisation IA appliquée !" })
        setAiSuggestionOpen(false)
        setAiSuggestion(null)
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Impossible d'appliquer la modification" })
      })
  }

  // Filter and search snippets
  const filtered = React.useMemo(() => {
    return snippets.filter(s => {
      const matchesSearch = 
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.code?.toLowerCase().includes(search.toLowerCase()) ||
        s.language?.toLowerCase().includes(search.toLowerCase()) ||
        s.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
      
      const matchesLang = selectedLanguageFilter === "all" || s.language === selectedLanguageFilter
      
      return matchesSearch && matchesLang
    })
  }, [snippets, search, selectedLanguageFilter])

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-white h-8 w-8" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8 px-2 md:px-0">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            <Code2 className="h-7 w-7 text-zinc-400" /> Coffre-fort de Code
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">Gérez et accédez à vos blocs de code réutilisables.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language filter dropdown */}
          <Select value={selectedLanguageFilter} onValueChange={setSelectedLanguageFilter}>
            <SelectTrigger className="w-40 h-10 md:h-11 bg-white/5 border-white/10 rounded-xl text-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-zinc-400" />
              <SelectValue placeholder="Langage" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="all">Tous les langages</SelectItem>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isAdding} onOpenChange={(v) => { if (!v) resetForm(); else setIsAdding(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-zinc-200 rounded-xl h-10 md:h-11 font-bold px-4 md:px-6 shadow-lg shadow-white/5 flex items-center gap-2">
                <Plus className="h-4.5 w-4.5" /> Nouvel Extrait
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 w-[95vw] sm:max-w-[700px] rounded-[1.5rem] md:rounded-[2rem] p-0 overflow-hidden shadow-2xl">
              <ScrollArea className="max-h-[85vh]">
                <div className="p-5 md:p-8 space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <Code2 className="h-5 w-5 text-white" />
                      </div>
                      {isEditing ? "Modifier l'extrait" : "Ajouter un extrait"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Titre de l'extrait</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Auth Guard React..." className="bg-white/5 border-white/10 h-11 rounded-xl text-sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Langage de programmation</label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-full h-11 bg-white/5 border-white/10 rounded-xl text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover text-popover-foreground border-border max-h-48 overflow-y-auto">
                            {LANGUAGES.map(lang => (
                              <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Tags (Séparés par des virgules)</label>
                        <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="Ex: React, Auth, security" className="bg-white/5 border-white/10 h-11 rounded-xl text-sm" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Bloc de code</label>
                      <Textarea 
                        value={code} 
                        onChange={e => setCode(e.target.value)} 
                        placeholder={`const myFunc = () => {\n  console.log("hello world");\n};`} 
                        className="bg-black/60 border-white/10 min-h-[250px] rounded-xl font-mono text-xs leading-relaxed resize-none text-zinc-300" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3">
                  <Button variant="ghost" onClick={resetForm} className="rounded-xl h-11 px-6 text-white" disabled={isSaving}>Annuler</Button>
                  <Button 
                    className="bg-white text-black hover:bg-zinc-200 rounded-xl h-11 px-8 font-bold flex items-center gap-2" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 animate-spin" /> : <Check className="h-4" />}
                    Enregistrer
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher par titre, tag ou langage..." 
          className="pl-11 h-11 md:h-12 bg-white/5 border-white/10 rounded-xl md:rounded-2xl focus-visible:ring-white/10 text-xs md:text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Snippet Grid/List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Code2 className="h-7 w-7 text-zinc-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white/50">Aucun extrait trouvé</h3>
              <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                {search || selectedLanguageFilter !== "all" 
                  ? "Ajustez vos filtres ou votre recherche." 
                  : "Ajoutez votre premier snippet technique."}
              </p>
            </div>
          </div>
        ) : (
          filtered.map(snippet => (
            <div key={snippet.id} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all">
              
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    <span className="text-[10px] font-mono font-extrabold uppercase text-white/70">
                      {snippet.language ? snippet.language.slice(0, 2) : "co"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm md:text-base truncate pr-2">{snippet.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] md:text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {snippet.createdAt?.toDate?.()?.toLocaleDateString("fr-FR", { hour: '2-digit', minute:'2-digit' }) || "Enregistrement..."}
                      </span>
                      <span className="text-zinc-600 px-1.5 py-0.5 border border-white/5 rounded lowercase font-mono bg-white/[0.01]">
                        {snippet.language}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-white/10 h-8 md:h-9 text-[10px] md:text-xs text-white bg-white/5 border border-white/5 rounded-xl flex items-center gap-1.5"
                    onClick={() => handleOptimize(snippet)}
                    disabled={optimizing === snippet.id}
                  >
                    <Sparkles className={`h-3.5 w-3.5 text-yellow-400 ${optimizing === snippet.id ? 'animate-spin' : ''}`} />
                    <span>{optimizing === snippet.id ? 'Refactoring...' : 'Optimisation IA'}</span>
                  </Button>
                  
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white" onClick={() => handleCopy(snippet.code)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-white/10 text-white">
                      <DropdownMenuItem onClick={() => startEditing(snippet)} className="hover:bg-white/10 text-xs flex items-center gap-2 cursor-pointer rounded-lg p-2.5">
                        <Edit3 className="h-3.5 w-3.5" /> Modifier l'extrait
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSnippetToDelete(snippet.id)} className="text-red-400 hover:bg-red-500/10 text-xs flex items-center gap-2 cursor-pointer rounded-lg p-2.5">
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer l'extrait
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Code Pre container */}
              <div className="relative p-4">
                <ScrollArea className="max-w-full">
                  <pre className="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs leading-relaxed text-zinc-300 overflow-x-auto min-h-[80px]">
                    <code>{snippet.code}</code>
                  </pre>
                </ScrollArea>
                
                {/* Tags bottom container */}
                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-3 px-1">
                    {snippet.tags.map((tag: string) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setSearch(tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!snippetToDelete} onOpenChange={() => setSnippetToDelete(null)}>
        <AlertDialogContent className="glass border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-xl text-white font-bold">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 mt-2 text-xs md:text-sm">
              Cette action supprimera définitivement cet extrait de code de votre coffre-fort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-6 md:mt-8">
            <AlertDialogCancel className="rounded-xl border-white/10 text-white h-10 md:h-12">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold h-10 md:h-12">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Suggestions Review Modal */}
      <Dialog open={aiSuggestionOpen} onOpenChange={setAiSuggestionOpen}>
        <DialogContent className="glass border-white/10 w-[95vw] sm:max-w-[800px] rounded-[1.5rem] md:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <ScrollArea className="max-h-[85vh]">
            {aiSuggestion && (
              <div className="p-5 md:p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                    </div>
                    Optimisation IA par assistant
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" /> Résumé des améliorations
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{aiSuggestion.summary}</p>
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Détails des suggestions</h4>
                    <div className="space-y-3">
                      {aiSuggestion.suggestions?.map((sug: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                              <Zap className="h-3.5 w-3.5 text-yellow-500" /> Suggestion #{idx + 1}
                            </span>
                            <Badge className="text-[8px] font-bold uppercase tracking-wider bg-white/10 text-white rounded">
                              {sug.type}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{sug.description}</p>
                          
                          {sug.optimizedCodeSnippet && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block px-1">Code suggéré :</span>
                              <pre className="p-3 rounded-lg bg-black/60 font-mono text-[10px] leading-relaxed text-emerald-400 overflow-x-auto">
                                <code>{sug.optimizedCodeSnippet}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer with apply action */}
                <div className="pt-6 bg-white/[0.01] border-t border-white/5 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setAiSuggestionOpen(false)} className="rounded-xl h-11 px-6 text-white">Conserver l'original</Button>
                  
                  {aiSuggestion.suggestions?.some((s: any) => s.optimizedCodeSnippet) && (
                    <Button 
                      className="bg-white text-black hover:bg-zinc-200 rounded-xl h-11 px-8 font-bold flex items-center gap-2" 
                      onClick={() => {
                        // Find first available optimized snippet
                        const opt = aiSuggestion.suggestions.find((s: any) => s.optimizedCodeSnippet);
                        if (opt) applyAiSuggestion(opt.optimizedCodeSnippet);
                      }}
                    >
                      <Sparkles className="h-4 text-yellow-500 animate-pulse" />
                      Appliquer l'optimisation
                    </Button>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  )
}
