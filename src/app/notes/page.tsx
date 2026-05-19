"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Plus, 
  Search, 
  Trash2,
  Clock,
  Image as ImageIcon,
  Send,
  Wand2,
  Loader2,
  Terminal,
  ChevronLeft,
  Upload,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Edit3,
  BrainCircuit,
  AlertCircle,
  Download,
  Copy,
  Check
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
  DialogTrigger
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
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy, updateDoc, where } from "firebase/firestore"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { noteStructurer } from "@/ai/flows/note-structurer"
import { cn } from "@/lib/utils"

function renderRichText(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');

  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl md:text-2xl font-bold text-white mt-8 mb-4 border-b border-border/30 dark:border-white/10 pb-2">{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg md:text-xl font-bold text-white mt-6 mb-3">{line.slice(4)}</h3>;
    }
    if (line.trim().startsWith('> ')) {
      return (
        <blockquote key={i} className="my-5 pl-4 border-l-4 border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 py-3 px-4 rounded-r-xl text-zinc-700 dark:text-zinc-300 italic font-medium leading-relaxed rounded-r-2xl border border-indigo-500/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            <BrainCircuit className="h-8 w-8" />
          </div>
          {renderInline(line.trim().slice(2))}
        </blockquote>
      );
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return <li key={i} className="ml-4 md:ml-6 mb-2 text-zinc-700 dark:text-zinc-300 list-disc">{renderInline(line.trim().slice(2))}</li>;
    }
    if (line.trim().match(/^\d+\.\s/)) {
      const content = line.trim().replace(/^\d+\.\s/, '');
      return <li key={i} className="ml-4 md:ml-6 mb-2 text-zinc-700 dark:text-zinc-300 list-decimal">{renderInline(content)}</li>;
    }
    return <p key={i} className="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[1.2em]">{renderInline(line)}</p>;
  });
}

function renderInline(text: string) {
  const regex = /(\*\*.*?\*\*|`.*?`|https?:\/\/[^\s]+)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-border dark:border-white/10 font-mono text-xs text-blue-600 dark:text-blue-300 mx-0.5">{part.slice(1, -1)}</code>;
    }
    if (part.match(/^https?:\/\/[^\s]+$/)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium transition-colors break-all mx-0.5"
        >
          {part} <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    }
    return part;
  });
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 border border-white/10 text-zinc-500 hover:text-white dark:text-zinc-400 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center justify-center active:scale-95 no-print backdrop-blur-md shadow-lg"
      title="Copier le code"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500 animate-in zoom-in duration-300" />
      ) : (
        <Copy className="h-3.5 w-3.5 animate-in zoom-in duration-300" />
      )}
    </button>
  );
}

function highlightCode(code: string, lang: string) {
  const cleanLang = lang?.toLowerCase();
  if (cleanLang !== 'javascript' && cleanLang !== 'typescript' && cleanLang !== 'js' && cleanLang !== 'ts' && cleanLang !== 'json') {
    return <code>{code}</code>;
  }

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let tokenCounter = 0;
  const tokenStore: { [key: string]: string } = {};

  // 1. Comments
  html = html.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match) => {
    const key = `___TOKEN_${tokenCounter++}___`;
    tokenStore[key] = `<span class="text-zinc-500/80 italic dark:text-zinc-500/90">${match}</span>`;
    return key;
  });

  // 2. Strings
  html = html.replace(/(["'`])(.*?)\1/g, (match) => {
    const key = `___TOKEN_${tokenCounter++}___`;
    tokenStore[key] = `<span class="text-emerald-600 dark:text-emerald-400 font-medium">${match}</span>`;
    return key;
  });

  // 3. Keywords
  html = html.replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|default|break|continue|import|export|from|class|extends|new|this|async|await|try|catch|finally|throw|typeof|instanceof|true|false|null|undefined)\b/g, (match) => {
    return `<span class="text-violet-600 dark:text-violet-400 font-semibold">${match}</span>`;
  });

  // 4. Built-ins
  html = html.replace(/\b(console|log|error|document|window|fetch|response|result|success|api|process|env|then|catch)\b/g, (match) => {
    return `<span class="text-blue-600 dark:text-blue-400 font-medium">${match}</span>`;
  });

  // 5. Numbers
  html = html.replace(/\b(\d+)\b/g, (match) => {
    return `<span class="text-amber-600 dark:text-amber-400">${match}</span>`;
  });

  // Restore placeholders
  for (const key in tokenStore) {
    html = html.replace(key, tokenStore[key]);
  }

  return <code dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderNoteContent(text: string) {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
      const lang = match?.[1] || "code";
      const code = match?.[2] || part.slice(3, -3);
      
      return (
        <div key={i} className="my-6 relative group animate-in fade-in zoom-in duration-500 max-w-full">
          <div className="absolute -top-3 left-4 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-border dark:border-white/10 flex items-center gap-2 z-10 shadow-xl no-print">
            <Terminal className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">{lang}</span>
          </div>
          <CopyCodeButton code={code.trim()} />
          <pre className="p-3 sm:p-4 md:p-6 pt-7 sm:pt-8 rounded-2xl bg-black/80 border border-border dark:border-white/10 font-mono text-xs md:text-sm overflow-x-auto text-zinc-800 dark:text-zinc-300 shadow-2xl scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10">
            {highlightCode(code.trim(), lang)}
          </pre>
        </div>
      );
    }
    return <div key={i}>{renderRichText(part)}</div>;
  });
}

export default function JournalPage() {
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [isStructuring, setIsStructuring] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [noteToDelete, setNoteToDelete] = React.useState<string | null>(null)

  const [title, setTitle] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [img, setImg] = React.useState("")
  const [link, setLink] = React.useState("")

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  React.useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsAdding(true)
    }
    const idParam = searchParams.get('id')
    if (idParam) {
      setSelectedId(idParam)
    }
  }, [searchParams])

  const q = React.useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "notes"), 
      where("userId", "==", user.uid)
    )
  }, [db, user])

  const { data: rawNotes, loading } = useCollection<any>(q)

  const notes = React.useMemo(() => {
    if (!rawNotes) return []
    return [...rawNotes].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [rawNotes])

  const selected = React.useMemo(() => notes?.find(n => n.id === selectedId), [notes, selectedId])

  const startEditing = () => {
    if (!selected) return
    setTitle(selected.title || "")
    setDesc(selected.description || "")
    setImg(selected.imageUrl || "")
    setLink(selected.link || "")
    setIsEditing(true)
    setIsAdding(true)
  }

  const resetForm = () => {
    setTitle(""); setDesc(""); setImg(""); setLink("")
    setIsEditing(false)
    setIsAdding(false)
    setIsSaving(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
    setIsUploading(true)
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        setImg(result.data.url)
        toast({ title: "Image hébergée avec succès" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur d'upload" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = () => {
    if (!db || !user) return
    if (!title.trim() || !desc.trim()) {
      toast({ variant: "destructive", title: "Champs requis", description: "Le titre et la description sont obligatoires." })
      return
    }

    setIsSaving(true)
    const baseData = {
      title: title.trim(),
      description: desc.trim(),
      imageUrl: img || "",
      link: link || "",
      userId: user.uid,
      updatedAt: serverTimestamp()
    }

    if (isEditing && selectedId) {
      updateDoc(doc(db, "notes", selectedId), baseData)
        .then(() => {
          toast({ title: "Note mise à jour avec succès" })
          resetForm()
        })
        .catch(async (err: any) => {
          setIsSaving(false)
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `notes/${selectedId}`,
            operation: 'update',
            requestResourceData: baseData,
          }));
        })
    } else {
      const newData = { ...baseData, createdAt: serverTimestamp() }
      addDoc(collection(db, "notes"), newData)
        .then(() => {
          toast({ title: "Note enregistrée dans votre journal" })
          resetForm()
        })
        .catch(async (err: any) => {
          setIsSaving(false)
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'notes',
            operation: 'create',
            requestResourceData: newData,
          }))
        })
    }
  }

  const confirmDelete = () => {
    if (!db || !noteToDelete) return
    const id = noteToDelete
    deleteDoc(doc(db, "notes", id))
      .then(() => {
        toast({ title: "Note supprimée" })
        setNoteToDelete(null)
        if (selectedId === id) setSelectedId(null)
      })
      .catch(async (err: any) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `notes/${id}`,
          operation: 'delete',
        }));
      })
  }

  const handleAIFormatting = async () => {
    if (isStructuring || !desc.trim()) return
    setIsStructuring(true)
    try {
      const res = await noteStructurer({ rawContent: desc })
      setDesc(res.structuredContent)
      if (res.suggestedTitle && !title.trim()) setTitle(res.suggestedTitle)
      toast({ title: "Mise en forme IA réussie" })
    } catch (e) {
      toast({ variant: "destructive", title: "L'assistant IA est temporairement indisponible." })
    } finally {
      setIsStructuring(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const filtered = notes?.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.description?.toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-white h-8 w-8" /></div>

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-170px)] md:h-[calc(100vh-140px)] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden glass shadow-2xl relative">
      <div className={cn(
        "w-full md:w-80 border-r border-white/5 flex flex-col bg-white/[0.01] transition-all duration-300 no-print",
        selectedId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 md:p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg md:text-xl text-white">Journal Tech</h2>
            <Dialog open={isAdding} onOpenChange={(v) => { if (!v) resetForm(); else setIsAdding(true); }}>
              <DialogTrigger asChild>
                <button className="h-10 w-10 rounded-xl bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all active:scale-95">
                  <Plus className="h-5 w-5" />
                </button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 w-[95vw] sm:max-w-[700px] rounded-[1.5rem] md:rounded-[2rem] p-0 overflow-hidden shadow-2xl">
                <ScrollArea className="max-h-[85vh]">
                  <div className="p-5 md:p-10 space-y-6 md:space-y-8">
                    <DialogHeader>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-white flex items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                          <Edit3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        {isEditing ? "Modifier la note" : "Nouvelle Entrée"}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-5 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Titre de la note</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Débogage API Auth..." className="bg-white/5 border-white/10 h-11 md:h-12 rounded-xl text-sm md:text-base" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 mb-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Contenu (Markdown supporté)</label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[9px] uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 w-fit rounded-full border border-white/5" 
                            onClick={handleAIFormatting} 
                            disabled={isStructuring}
                          >
                            <Wand2 className={`h-3 w-3 mr-2 ${isStructuring ? 'animate-spin' : ''}`} /> Mise en forme IA
                          </Button>
                        </div>
                        <Textarea 
                          value={desc} 
                          onChange={e => setDesc(e.target.value)} 
                          placeholder="Collez vos logs, code ou réflexions..." 
                          className="bg-white/5 border-white/10 min-h-[200px] md:min-h-[350px] rounded-2xl resize-none font-sans leading-relaxed text-sm md:text-base" 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1"><ImageIcon className="h-3 w-3" /> Image (Optionnel)</label>
                          <div className="flex gap-2">
                            <Input value={img} onChange={e => setImg(e.target.value)} placeholder="URL..." className="bg-white/5 border-white/10 h-11 md:h-12 rounded-xl text-[10px] md:text-xs flex-1" />
                            <div className="relative">
                              <Input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full" disabled={isUploading} />
                              <div className="h-11 md:h-12 w-11 md:w-12 border border-white/10 bg-white/5 rounded-xl flex items-center justify-center">
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2 px-1"><LinkIcon className="h-3 w-3" /> Source Externe</label>
                          <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://doc.com" className="bg-white/5 border-white/10 h-11 md:h-12 rounded-xl text-[10px] md:text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
                    <Button variant="ghost" onClick={resetForm} className="rounded-xl h-11 md:h-12 px-6 md:px-8 text-white order-2 sm:order-1" disabled={isSaving}>Annuler</Button>
                    <Button 
                      className="bg-white text-black hover:bg-zinc-200 rounded-xl h-11 md:h-12 px-8 md:px-12 font-bold order-1 sm:order-2" 
                      onClick={handleSave}
                      disabled={isSaving || isUploading}
                    >
                      {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                      Enregistrer
                    </Button>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Chercher dans vos notes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 md:h-11 bg-white/5 border-white/10 rounded-xl text-sm" />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 md:p-4 space-y-2 md:space-y-3">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin h-6 w-6 text-white/20 mx-auto" /></div>
            ) : filtered?.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground p-8">Aucun résultat trouvé.</p>
            ) : filtered?.map(n => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={cn(
                  "group w-full p-4 md:p-5 rounded-xl md:rounded-2xl transition-all duration-300 text-left border",
                  selectedId === n.id ? 'bg-white/10 border-white/20 shadow-xl' : 'border-transparent hover:bg-white/[0.03]'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-xs md:text-sm font-bold truncate pr-4", selectedId === n.id ? 'text-white' : 'text-zinc-400')}>{n.title}</span>
                  <Trash2 
                    className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400 opacity-0 md:group-hover:opacity-100 transition-opacity" 
                    onClick={e => { e.stopPropagation(); setNoteToDelete(n.id); }} 
                  />
                </div>
                <p className="text-[10px] md:text-[11px] line-clamp-2 text-zinc-500 font-mono italic opacity-60">{n.description}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className={cn(
        "flex-1 min-w-0 w-full max-w-full flex flex-col bg-black/20 overflow-hidden relative transition-all duration-300",
        selectedId ? "flex" : "hidden md:flex"
      )}>
        {selected ? (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500 note-print-container">
            <div className="h-auto py-3 md:py-0 md:h-24 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between px-3 md:px-12 bg-white/[0.01] backdrop-blur-md sticky top-0 z-20 no-print gap-3 md:gap-0">
              <div className="flex items-center justify-between md:justify-start gap-2 md:gap-6 min-w-0 w-full md:w-auto">
                 <button className="md:hidden text-white h-8 w-8 flex items-center justify-center bg-white/5 rounded-xl shrink-0" onClick={() => setSelectedId(null)}>
                   <ChevronLeft className="h-4 w-4" />
                 </button>
                 <div className="hidden sm:flex h-9 w-9 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/5 items-center justify-center border border-white/10 shrink-0">
                   <FileText className="h-4 w-4 md:h-7 md:w-7 text-white" />
                 </div>
                 <div className="min-w-0 flex-1 text-center md:text-left">
                   <h2 className="text-sm md:text-2xl font-bold text-white tracking-tight truncate text-center md:text-left w-full">{selected.title}</h2>
                   <span className="flex items-center justify-center md:justify-start text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-0.5">
                      <Clock className="h-2.5 w-2.5 mr-1.5 md:mr-2" /> {selected.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'En cours...'}
                   </span>
                 </div>
                 <div className="w-8 h-8 md:hidden shrink-0" />
              </div>
              <div className="flex gap-2 justify-center w-full md:w-auto shrink-0">
                <Button variant="outline" size="sm" className="h-8 md:h-10 w-9 md:w-auto px-0 md:px-4 border-white/10 text-white flex items-center justify-center" onClick={handleDownloadPDF} title="Exporter PDF">
                  <Download className="h-3.5 w-3.5 md:mr-2" /> <span className="hidden md:inline">Exporter PDF</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 md:h-10 w-9 md:w-auto px-0 md:px-4 border-white/10 text-white flex items-center justify-center" onClick={startEditing} title="Modifier">
                  <Edit3 className="h-3.5 w-3.5 md:mr-2" /> <span className="hidden md:inline">Modifier</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 md:h-10 w-9 md:w-auto px-0 md:px-4 border-red-500/20 text-red-400 flex items-center justify-center" onClick={() => setNoteToDelete(selected.id)} title="Supprimer">
                  <Trash2 className="h-3.5 w-3.5 md:mr-2" /> <span className="hidden md:inline">Supprimer</span>
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 w-full max-w-full">
              <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 md:p-12 lg:p-20 space-y-6 md:space-y-16 pb-32">
                <div className="space-y-6 md:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 items-center text-center">
                    <div className="flex items-center justify-center sm:justify-start gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] md:tracking-[0.4em]">
                      <AlertCircle className="h-3.5 w-3.5 text-blue-400" /> Journal de documentation
                    </div>
                    {selected.link && (
                      <a href={selected.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center sm:justify-start gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:underline bg-blue-400/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-blue-400/20 transition-all no-print">
                        <LinkIcon className="h-2.5 w-2.5 md:h-3 md:w-3" /> Source <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 text-sm md:text-lg leading-relaxed whitespace-pre-wrap bg-white/40 dark:bg-white/[0.01] backdrop-blur-xl p-4 sm:p-6 md:p-12 rounded-[1.2rem] md:rounded-[2.5rem] border border-border dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none no-print">
                       <BrainCircuit className="h-20 w-20 md:h-32 md:w-32" />
                    </div>
                    <div className="relative z-10 markdown-content w-full max-w-full overflow-hidden">
                      {renderNoteContent(selected.description)}
                    </div>
                  </div>
                </div>

                {selected.imageUrl && (
                  <div className="space-y-4 md:space-y-8">
                    <div className="flex items-center justify-center sm:justify-start gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] md:tracking-[0.4em] px-1">
                      <ImageIcon className="h-3.5 w-3.5 text-green-400" /> Support visuel
                    </div>
                    <div className="relative aspect-video rounded-[1.2rem] md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 group">
                      <Image src={selected.imageUrl} alt="Documentation" fill className="object-contain transition-transform duration-700 group-hover:scale-105" unoptimized />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-6 md:space-y-12">
            <div className="h-20 w-20 md:h-44 md:w-44 rounded-[2rem] md:rounded-[4rem] bg-white/[0.02] flex items-center justify-center border border-white/5 shadow-2xl">
              <BrainCircuit className="h-10 w-10 md:h-24 md:w-24 text-white/5 animate-pulse" />
            </div>
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-xl md:text-5xl font-headline font-bold text-white/20 italic tracking-tighter">Votre Second Cerveau</h3>
              <p className="text-muted-foreground text-[10px] md:text-sm max-w-[280px] md:max-w-[350px] mx-auto opacity-60">
                Sélectionnez une note ou commencez à documenter une nouvelle solution technique.
              </p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent className="glass border-white/10 rounded-[1.2rem] md:rounded-[2.5rem] p-5 md:p-8 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-xl text-white font-bold">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 mt-2 text-xs md:text-sm">
              Cette action supprimera définitivement cette documentation de votre base de connaissances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-6 md:mt-8">
            <AlertDialogCancel className="rounded-xl border-white/10 text-white h-10 md:h-12">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold h-10 md:h-12">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
