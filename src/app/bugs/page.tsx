"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Bug as BugIcon, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  Loader2, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  HelpCircle, 
  Cpu, 
  CheckCircle,
  Play,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, where, updateDoc } from "firebase/firestore"
import { aiDebuggingAssistant } from "@/ai/flows/ai-debugging-assistant"

const SEVERITIES = [
  { id: "Critique", label: "Critique", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  { id: "Haute", label: "Haute", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { id: "Moyenne", label: "Moyenne", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  { id: "Basse", label: "Basse", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
]

const STATUSES = [
  { id: "À résoudre", label: "À résoudre", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  { id: "En cours", label: "En cours", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { id: "Résolu", label: "Résolu", color: "bg-green-500/10 text-green-500 border-green-500/20" },
]

export default function BugTrackerPage() {
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
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "Critique" | "Résolu" | "En cours" | "À résoudre">("all")
  const [analyzing, setAnalyzing] = React.useState<string | null>(null)

  const [isAdding, setIsAdding] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [bugToDelete, setBugToDelete] = React.useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = React.useState("")
  const [problem, setProblem] = React.useState("")
  const [solution, setSolution] = React.useState("")
  const [severity, setSeverity] = React.useState("Moyenne")
  const [status, setStatus] = React.useState("À résoudre")

  // AI Debugging suggestion state
  const [aiDebugResult, setAiDebugResult] = React.useState<any | null>(null)
  const [aiDebugOpen, setAiDebugOpen] = React.useState(false)

  // Firestore Query
  const q = React.useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "bugs"),
      where("userId", "==", user.uid)
    )
  }, [db, user])

  const { data: rawBugs, loading } = useCollection<any>(q)

  const bugs = React.useMemo(() => {
    if (!rawBugs) return []
    return [...rawBugs].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [rawBugs])

  // Count metrics dynamically
  const metrics = React.useMemo(() => {
    const all = bugs.length
    const critical = bugs.filter(b => b.severity === "Critique").length
    const resolved = bugs.filter(b => b.status === "Résolu").length
    const inProgress = bugs.filter(b => b.status === "En cours").length
    const toSolve = bugs.filter(b => b.status === "À résoudre").length
    return { all, critical, resolved, inProgress, toSolve }
  }, [bugs])

  const resetForm = () => {
    setTitle("")
    setProblem("")
    setSolution("")
    setSeverity("Moyenne")
    setStatus("À résoudre")
    setIsEditing(false)
    setIsAdding(false)
    setIsSaving(false)
    setSelectedId(null)
  }

  const startEditing = (bug: any) => {
    setTitle(bug.title || "")
    setProblem(bug.problem || "")
    setSolution(bug.solution || "")
    setSeverity(bug.severity || "Moyenne")
    setStatus(bug.status || "À résoudre")
    setSelectedId(bug.id)
    setIsEditing(true)
    setIsAdding(true)
  }

  const handleSave = () => {
    if (!db || !user) return
    if (!title.trim() || !problem.trim()) {
      toast({ variant: "destructive", title: "Champs requis", description: "Le titre et la description du problème sont requis." })
      return
    }

    setIsSaving(true)
    const baseData = {
      title: title.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      severity,
      status,
      userId: user.uid,
      updatedAt: serverTimestamp()
    }

    if (isEditing && selectedId) {
      updateDoc(doc(db, "bugs", selectedId), baseData)
        .then(() => {
          toast({ title: "Bug mis à jour" })
          resetForm()
        })
        .catch(() => {
          setIsSaving(false)
          toast({ variant: "destructive", title: "Erreur de modification" })
        })
    } else {
      const newData = { ...baseData, createdAt: serverTimestamp() }
      addDoc(collection(db, "bugs"), newData)
        .then(() => {
          toast({ title: "Nouveau bug signalé" })
          resetForm()
        })
        .catch(() => {
          setIsSaving(false)
          toast({ variant: "destructive", title: "Erreur de création" })
        })
    }
  }

  const confirmDelete = () => {
    if (!db || !bugToDelete) return
    deleteDoc(doc(db, "bugs", bugToDelete))
      .then(() => {
        toast({ title: "Bug supprimé de l'historique" })
        setBugToDelete(null)
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Erreur de suppression" })
      })
  }

  const handleAIDebug = async (bug: any) => {
    setAnalyzing(bug.id)
    try {
      const result = await aiDebuggingAssistant({
        errorLog: bug.problem,
        codeSnippet: "N/A"
      })
      setAiDebugResult({ bugId: bug.id, ...result })
      setAiDebugOpen(true)
      toast({
        title: "Analyse IA terminée !",
        description: "Découvrez les pistes de résolution de l'assistant."
      })
    } catch (e) {
      toast({ variant: "destructive", title: "L'assistant IA est temporairement indisponible." })
    } finally {
      setAnalyzing(null)
    }
  }

  const applyDebugSolution = (selectedSolution: string) => {
    if (!db || !aiDebugResult) return
    const id = aiDebugResult.bugId
    updateDoc(doc(db, "bugs", id), {
      solution: selectedSolution,
      status: "Résolu",
      updatedAt: serverTimestamp()
    })
      .then(() => {
        toast({ title: "Solution enregistrée et bug marqué comme Résolu !" })
        setAiDebugOpen(false)
        setAiDebugResult(null)
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Erreur lors de la sauvegarde" })
      })
  }

  const filtered = React.useMemo(() => {
    return bugs.filter(b => {
      const matchesSearch = 
        b.title?.toLowerCase().includes(search.toLowerCase()) ||
        b.problem?.toLowerCase().includes(search.toLowerCase()) ||
        b.solution?.toLowerCase().includes(search.toLowerCase())
      
      let matchesFilter = true
      if (selectedFilter === "Critique") {
        matchesFilter = b.severity === "Critique"
      } else if (selectedFilter === "Résolu") {
        matchesFilter = b.status === "Résolu"
      } else if (selectedFilter === "En cours") {
        matchesFilter = b.status === "En cours"
      } else if (selectedFilter === "À résoudre") {
        matchesFilter = b.status === "À résoudre"
      }

      return matchesSearch && matchesFilter
    })
  }, [bugs, search, selectedFilter])

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-white h-8 w-8" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8 px-2 md:px-0">
      
      {/* Header and Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-white flex items-center gap-3">
            <BugIcon className="h-8 w-8 text-zinc-500" />
            Suivi des Bugs
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">Gérez votre dette technique et vos solutions historiques.</p>
        </div>

        <Dialog open={isAdding} onOpenChange={(v) => { if (!v) resetForm(); else setIsAdding(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-zinc-200 rounded-xl h-10 md:h-11 font-bold px-4 md:px-6 shadow-lg shadow-white/5 flex items-center gap-2 self-start sm:self-auto">
              <Plus className="h-4.5 w-4.5" /> Signaler un Bug
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10 w-[95vw] sm:max-w-[700px] rounded-[1.5rem] md:rounded-[2rem] p-0 overflow-hidden shadow-2xl">
            <ScrollArea className="max-h-[85vh]">
              <div className="p-5 md:p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                      <BugIcon className="h-5 w-5 text-white" />
                    </div>
                    {isEditing ? "Modifier le ticket" : "Signaler un Bug"}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Titre de l'anomalie</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Fuite mémoire Prisma client..." className="bg-white/5 border-white/10 h-11 rounded-xl text-sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Sévérité du bug</label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger className="w-full h-11 bg-white/5 border-white/10 rounded-xl text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border">
                          {SEVERITIES.map(sev => (
                            <SelectItem key={sev.id} value={sev.id}>{sev.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Statut actuel</label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full h-11 bg-white/5 border-white/10 rounded-xl text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border">
                          {STATUSES.map(stat => (
                            <SelectItem key={stat.id} value={stat.id}>{stat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Description du problème (Logs, Code erroné)</label>
                    <Textarea 
                      value={problem} 
                      onChange={e => setProblem(e.target.value)} 
                      placeholder="Décrivez l'erreur ou collez les logs ici..." 
                      className="bg-black/60 border-white/10 min-h-[150px] rounded-xl font-mono text-xs leading-relaxed resize-none text-zinc-300" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Solution (Laisser vide si non résolu)</label>
                    <Textarea 
                      value={solution} 
                      onChange={e => setSolution(e.target.value)} 
                      placeholder="Comment l'erreur a-t-elle été fixée ?" 
                      className="bg-black/60 border-white/10 min-h-[100px] rounded-xl font-mono text-xs leading-relaxed resize-none text-zinc-300" 
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

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side Filters Pane */}
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Filtres</label>
            <div className="space-y-1 bg-white/[0.01] border border-white/5 rounded-2xl p-2.5">
              <FilterItem label="Tous les logs" count={metrics.all} active={selectedFilter === "all"} onClick={() => setSelectedFilter("all")} />
              <FilterItem label="Critique" count={metrics.critical} active={selectedFilter === "Critique"} color="text-red-400" onClick={() => setSelectedFilter("Critique")} />
              <FilterItem label="À résoudre" count={metrics.toSolve} active={selectedFilter === "À résoudre"} color="text-zinc-400" onClick={() => setSelectedFilter("À résoudre")} />
              <FilterItem label="En cours" count={metrics.inProgress} active={selectedFilter === "En cours"} color="text-amber-400" onClick={() => setSelectedFilter("En cours")} />
              <FilterItem label="Résolus" count={metrics.resolved} active={selectedFilter === "Résolu"} color="text-green-400" onClick={() => setSelectedFilter("Résolu")} />
            </div>
          </div>
        </div>

        {/* Right side list and search */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par titre, problème ou solution..." 
              className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 glass rounded-2xl border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                  <BugIcon className="h-7 w-7 text-zinc-600 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white/50">Aucun bug trouvé</h3>
                  <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                    {search || selectedFilter !== "all" 
                      ? "Ajustez vos critères de recherche ou de filtre." 
                      : "Génial ! Votre tableau de bord est exempt d'anomalies."}
                  </p>
                </div>
              </div>
            ) : (
              filtered.map(bug => {
                const sevConfig = SEVERITIES.find(s => s.id === bug.severity) || SEVERITIES[2]
                const statConfig = STATUSES.find(s => s.id === bug.status) || STATUSES[0]

                return (
                  <Card key={bug.id} className="glass border-white/5 overflow-hidden group hover:border-white/10 transition-all rounded-2xl">
                    <CardContent className="p-0">
                      
                      {/* Bug Card Header */}
                      <div className="p-5 md:p-6">
                        <div className="flex items-start justify-between mb-4 gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              {bug.status === "Résolu" ? (
                                <CheckCircle className="h-4.5 w-4.5 text-green-400 shrink-0" />
                              ) : bug.status === "En cours" ? (
                                <Loader2 className="h-4.5 w-4.5 text-amber-400 shrink-0 animate-spin" />
                              ) : (
                                <AlertTriangle className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                              )}
                              <h3 className="text-sm md:text-base font-bold text-white truncate pr-2">{bug.title}</h3>
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {bug.createdAt?.toDate?.()?.toLocaleDateString("fr-FR", { hour: '2-digit', minute:'2-digit' }) || "Enregistrement..."}
                              </span>
                              <Badge variant="outline" className={`text-[8px] uppercase tracking-wider font-bold ${statConfig.color} rounded`}>
                                {bug.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className={`text-[8px] uppercase tracking-wider font-bold shrink-0 rounded ${sevConfig.color}`}>
                              Sévérité : {bug.severity}
                            </Badge>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass border-white/10 text-white">
                                <DropdownMenuItem onClick={() => startEditing(bug)} className="hover:bg-white/10 text-xs flex items-center gap-2 cursor-pointer rounded-lg p-2.5">
                                  <Edit3 className="h-3.5 w-3.5" /> Modifier le ticket
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setBugToDelete(bug.id)} className="text-red-400 hover:bg-red-500/10 text-xs flex items-center gap-2 cursor-pointer rounded-lg p-2.5">
                                  <Trash2 className="h-3.5 w-3.5" /> Supprimer de l'historique
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Problem & Solution Display */}
                        <div className="grid grid-cols-1 gap-4">
                          
                          {/* Problem container */}
                          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block mb-1 px-0.5">Problème</span>
                            <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto pr-1">
                              {bug.problem}
                            </pre>
                          </div>

                          {/* Solution container (only if present) */}
                          {bug.solution && (
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                              <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest block mb-1 px-0.5">Solution validée</span>
                              <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto pr-1">
                                {bug.solution}
                              </pre>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Footer Actions */}
                      <div className="bg-white/[0.01] px-5 py-3 flex items-center justify-between border-t border-white/5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-1.5 bg-white/5 border border-white/5 font-bold"
                          onClick={() => handleAIDebug(bug)}
                          disabled={analyzing === bug.id}
                        >
                          <Sparkles className={`h-3.5 w-3.5 text-yellow-400 ${analyzing === bug.id ? 'animate-spin' : ''}`} />
                          <span>{analyzing === bug.id ? 'Analyse IA...' : 'Insights IA'}</span>
                        </Button>

                        {bug.status !== "Résolu" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-green-400 hover:bg-green-500/10 rounded-lg flex items-center gap-1 border border-green-500/20"
                            onClick={() => {
                              updateDoc(doc(db, "bugs", bug.id), {
                                status: "Résolu",
                                updatedAt: serverTimestamp()
                              }).then(() => toast({ title: "Marqué comme résolu !" }))
                            }}
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span>Résoudre</span>
                          </Button>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!bugToDelete} onOpenChange={() => setBugToDelete(null)}>
        <AlertDialogContent className="glass border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base md:text-xl text-white font-bold">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 mt-2 text-xs md:text-sm">
              Cette action supprimera définitivement ce bug et sa solution associée de votre historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 md:gap-3 mt-6 md:mt-8">
            <AlertDialogCancel className="rounded-xl border-white/10 text-white h-10 md:h-12">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold h-10 md:h-12">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Debugging Result Dialog */}
      <Dialog open={aiDebugOpen} onOpenChange={setAiDebugOpen}>
        <DialogContent className="glass border-white/10 w-[95vw] sm:max-w-[800px] rounded-[1.5rem] md:rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <ScrollArea className="max-h-[85vh]">
            {aiDebugResult && (
              <div className="p-5 md:p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                    </div>
                    Analyse de Débogage IA
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Explanation */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Explication du problème
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">{aiDebugResult.explanation}</p>
                  </div>

                  {/* Solutions suggested */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Solutions proposées</h4>
                    <div className="space-y-3">
                      {aiDebugResult.solutions?.map((sol: string, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                              <Cpu className="h-3.5 w-3.5 text-zinc-400" /> Solution #{idx + 1}
                            </span>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-1">{sol}</p>
                          </div>
                          
                          <Button 
                            className="bg-white text-black hover:bg-zinc-200 rounded-lg h-9 px-4 font-bold shrink-0 text-xs flex items-center gap-1"
                            onClick={() => applyDebugSolution(sol)}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Appliquer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 bg-white/[0.01] border-t border-white/5 flex justify-end">
                  <Button variant="ghost" onClick={() => setAiDebugOpen(false)} className="rounded-xl h-11 px-6 text-white">Fermer</Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function FilterItem({ 
  label, 
  count, 
  active, 
  color = "text-muted-foreground", 
  onClick 
}: { 
  label: string
  count: number
  active?: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all
        ${active 
          ? 'bg-white/10 text-white shadow-inner border border-white/5' 
          : `${color} hover:bg-white/5 hover:text-white`
        }
      `}
    >
      <span>{label}</span>
      <span className="text-[10px] font-mono opacity-50 bg-black/20 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  )
}
