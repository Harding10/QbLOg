"use client"

import React from "react"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
  Tag,
  AlignLeft,
  CalendarCheck,
  AlertTriangle,
  Bell
} from "lucide-react"
import Link from "next/link"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { collection, query, where, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

// Professional category styling map
const CATEGORIES = [
  { id: "dev", label: "Développement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  { id: "doc", label: "Documentation", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  { id: "review", label: "Active Recall (Révision)", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", dot: "bg-violet-400" },
  { id: "bug", label: "Bug à corriger", color: "bg-rose-500/20 text-rose-400 border-rose-500/30", dot: "bg-rose-400" },
  { id: "meeting", label: "Meeting / PR Review", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  { id: "personal", label: "Personnel / Loisirs", color: "bg-pink-500/20 text-pink-400 border-pink-500/30", dot: "bg-pink-400" },
]

export default function AgendaPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // State
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDay, setSelectedDay] = React.useState<Date>(new Date())
  const [isAddEventOpen, setIsAddEventOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form Fields State
  const [eventTitle, setEventTitle] = React.useState("")
  const [eventDescription, setEventDescription] = React.useState("")
  const [eventCategory, setEventCategory] = React.useState("dev")
  const [eventTime, setEventTime] = React.useState("")
  const [eventNoteId, setEventNoteId] = React.useState("")
  const [eventReminder, setEventReminder] = React.useState("0")

  // Firestore Queries
  const notesQuery = React.useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, "notes"), where("userId", "==", user.uid))
  }, [db, user])

  const eventsQuery = React.useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, "events"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: notes, loading: notesLoading } = useCollection<any>(notesQuery)
  const { data: events, loading: eventsLoading } = useCollection<any>(eventsQuery)

  // Helper: Format Date key (YYYY-MM-DD)
  const getFormatKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  // Pre-fill fields or clear when dialog changes
  React.useEffect(() => {
    if (!isAddEventOpen) {
      setEventTitle("")
      setEventDescription("")
      setEventCategory("dev")
      setEventTime("")
      setEventNoteId("")
      setEventReminder("0")
    }
  }, [isAddEventOpen])

  // Automatically update title if Active Recall note is selected
  React.useEffect(() => {
    if (eventCategory === "review" && eventNoteId) {
      const note = notes?.find(n => n.id === eventNoteId)
      if (note) {
        setEventTitle(`Réviser : ${note.title}`)
      }
    }
  }, [eventNoteId, eventCategory, notes])

  // Group notes by creation date for indicator dots
  const notesByDate = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    if (!notes) return map
    notes.forEach((note) => {
      const dateObj = note.createdAt?.toDate?.()
      if (dateObj) {
        const key = getFormatKey(dateObj)
        if (!map[key]) map[key] = []
        map[key].push(note)
      }
    })
    return map
  }, [notes])

  // Group events by target date
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    if (!events) return map
    events.forEach((evt) => {
      if (evt.date) {
        if (!map[evt.date]) map[evt.date] = []
        map[evt.date].push(evt)
      }
    })
    return map
  }, [events])

  // Calendar Controls
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Grid Grid Days Calculation
  const calendarDays = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    let startDayOfWeek = firstDayOfMonth.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const totalDays = new Date(year, month + 1, 0).getDate()
    const days: { date: Date; isCurrentMonth: boolean }[] = []

    const prevMonthDaysTotal = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDaysTotal - i),
        isCurrentMonth: false,
      })
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    const totalGridCells = 42
    const remainingCells = totalGridCells - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentDate])

  // Add Event to Firestore
  const handleAddEvent = async () => {
    if (!db || !user || !eventTitle.trim()) return

    setIsSubmitting(true)
    try {
      const dateKey = getFormatKey(selectedDay)
      const note = notes?.find(n => n.id === eventNoteId)

      await addDoc(collection(db, "events"), {
        userId: user.uid,
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        category: eventCategory,
        time: eventTime || null,
        reminderOffset: eventTime ? Number(eventReminder) : 0,
        date: dateKey,
        noteId: eventNoteId || null,
        noteTitle: note ? note.title : null,
        completed: false,
        createdAt: serverTimestamp()
      })

      toast({
        title: "Événement planifié",
        description: `"${eventTitle.trim()}" a été ajouté à votre agenda.`
      })
      setIsAddEventOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer l'événement."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle Event Status
  const handleToggleEvent = async (id: string, currentStatus: boolean) => {
    if (!db) return
    try {
      await updateDoc(doc(db, "events", id), {
        completed: !currentStatus
      })
      toast({
        title: !currentStatus ? "Tâche complétée !" : "Tâche réactivée",
        description: !currentStatus ? "L'événement a été marqué comme effectué." : "L'événement a été replanifié."
      })
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut." })
    }
  }

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, "events", id))
      toast({ title: "Événement supprimé" })
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'événement." })
    }
  }

  // Selected Day Calculations
  const selectedDayKey = getFormatKey(selectedDay)
  const notesOnSelectedDay = notesByDate[selectedDayKey] || []
  const eventsOnSelectedDay = React.useMemo(() => {
    const list = eventsByDate[selectedDayKey] || []
    return [...list].sort((a, b) => (a.time || "23:59").localeCompare(b.time || "23:59"))
  }, [eventsByDate, selectedDayKey])

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const isLoading = notesLoading || eventsLoading

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-12 py-2 md:py-6 animate-in fade-in duration-700 pb-24">
      {/* Page Title & Add Button */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 md:px-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <CalendarIcon className="h-3.5 w-3.5 text-blue-500" /> Agenda Pro & Calendrier Développeur
          </div>
          <h1 className="text-2xl md:text-5xl font-headline font-bold text-foreground tracking-tighter leading-none">Votre Emploi du Temps.</h1>
          <p className="text-muted-foreground text-xs md:text-base max-w-lg leading-relaxed">
            Un calendrier professionnel complet pour vos tâches, révisions et sessions de codage. Cliquez directement sur une date pour ajouter un événement.
          </p>
        </div>

        {/* Pro Event Dialog Trigger */}
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nouvel Événement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background text-foreground border-border max-w-md rounded-[1.5rem] md:rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Créer un Événement Pro
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs md:text-sm">
                Ajoutez un événement ou une tâche pour le <strong>{selectedDay.toLocaleDateString("fr-FR")}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Catégorie & Type
                </label>
                <Select value={eventCategory} onValueChange={setEventCategory}>
                  <SelectTrigger className="w-full h-11 bg-background border-border rounded-xl text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note Linker (Optional / Required for review) */}
              {(eventCategory === "review" || notes?.length > 0) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Associer une Note Technique {eventCategory === "review" && <span className="text-red-400">*</span>}
                  </label>
                  <Select value={eventNoteId} onValueChange={setEventNoteId}>
                    <SelectTrigger className="w-full h-11 bg-background border-border rounded-xl text-foreground">
                      <SelectValue placeholder="Sélectionner une note (optionnel)..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border max-h-48 overflow-y-auto">
                      {notes?.map((n) => (
                        <SelectItem key={n.id} value={n.id} className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">
                          {n.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Titre de l'événement <span className="text-red-400">*</span>
                </label>
                <Input
                  required
                  placeholder="ex: Session refactoring routeur, Révision..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="bg-background border-border rounded-xl text-foreground h-11"
                />
              </div>

              {/* Optional Time slot */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Horaire (optionnel)
                </label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="bg-background border-border rounded-xl text-foreground h-11"
                />
              </div>

              {/* Optional Reminder Offset */}
              {eventTime && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-blue-500" /> Rappel / Notification
                  </label>
                  <Select value={eventReminder} onValueChange={setEventReminder}>
                    <SelectTrigger className="w-full h-11 bg-background border-border rounded-xl text-foreground">
                      <SelectValue placeholder="Sélectionner le moment..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      <SelectItem value="0" className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">Au moment de l'événement</SelectItem>
                      <SelectItem value="5" className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">5 minutes avant</SelectItem>
                      <SelectItem value="15" className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">15 minutes avant</SelectItem>
                      <SelectItem value="30" className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">30 minutes avant</SelectItem>
                      <SelectItem value="60" className="hover:bg-accent hover:text-accent-foreground font-medium focus:bg-accent focus:text-accent-foreground">1 heure avant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlignLeft className="h-3 w-3" /> Notes & Détails
                </label>
                <Textarea
                  placeholder="Ajoutez des détails ou des objectifs pour cet événement..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="bg-background border-border rounded-xl text-foreground min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsAddEventOpen(false)} className="border-border text-foreground hover:bg-accent hover:text-accent-foreground h-11 rounded-xl">
                Annuler
              </Button>
              <Button disabled={!eventTitle.trim() || isSubmitting || (eventCategory === "review" && !eventNoteId)} onClick={handleAddEvent} className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl font-bold flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin opacity-40" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 px-2 md:px-0">
          
          {/* Calendar Card Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-white/5 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl relative overflow-hidden">
              
              {/* Month Header controls */}
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-3xl font-headline font-bold text-foreground tracking-tight">
                    {MONTHS[currentDate.getMonth()]}
                  </span>
                  <span className="text-muted-foreground font-mono font-bold text-sm md:text-lg">
                    {currentDate.getFullYear()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 md:h-10 md:w-10 border-border hover:bg-accent text-foreground rounded-xl">
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 md:h-10 md:w-10 border-border hover:bg-accent text-foreground rounded-xl">
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="space-y-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1 md:gap-3">
                  {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                    const formattedKey = getFormatKey(date)
                    const dayNotes = notesByDate[formattedKey] || []
                    const dayEvents = eventsByDate[formattedKey] || []
                    const isSel = getFormatKey(selectedDay) === formattedKey
                    const isTdy = isToday(date)

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isSel) {
                            setIsAddEventOpen(true)
                          } else {
                            setSelectedDay(date)
                          }
                        }}
                        title={isSel ? "Cliquer à nouveau pour ajouter un événement" : `${dayNotes.length} note(s) écrite(s), ${dayEvents.length} événement(s)`}
                        className={`
                          aspect-square relative rounded-xl md:rounded-2xl transition-all flex flex-col items-center justify-center border p-1 md:p-2 group
                          ${isCurrentMonth ? 'bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]' : 'opacity-25 bg-transparent'}
                          ${isSel ? 'border-blue-500/50 bg-blue-500/10 shadow-inner' : 'border-border/30 dark:border-white/[0.02]'}
                        `}
                      >
                        {/* Day Number */}
                        <span className={`
                          text-xs md:text-lg font-bold font-mono tracking-tight transition-colors
                          ${isTdy ? 'bg-blue-500 text-white rounded-full h-6 w-6 md:h-8 md:w-8 flex items-center justify-center font-extrabold shadow-lg shadow-blue-500/20' : 'text-foreground/80 dark:text-zinc-300'}
                        `}>
                          {date.getDate()}
                        </span>

                        {/* Event indicator dots */}
                        <div className="flex gap-1 mt-1 justify-center min-h-[4px] flex-wrap max-w-full">
                          {/* Note Dot (Green) */}
                          {dayNotes.length > 0 && (
                            <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-emerald-400 block shrink-0" title={`${dayNotes.length} Note(s) rédigée(s)`} />
                          )}
                          {/* Event Indicators (color coded matching their categories) */}
                          {dayEvents.slice(0, 4).map((evt) => {
                            const cat = CATEGORIES.find(c => c.id === evt.category)
                            return (
                              <span key={evt.id} className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${cat ? cat.dot : 'bg-white'} block shrink-0`} title={evt.title} />
                            )
                          })}
                        </div>

                        {/* Direct visual "+" icon overlay on selected or hovered cell */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 h-4.5 w-4.5 rounded-md flex items-center justify-center text-foreground dark:text-white text-[10px] pointer-events-none md:pointer-events-auto">
                          <Plus className="h-2.5 w-2.5" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legends */}
              <div className="flex flex-wrap items-center gap-4 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5 text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider justify-center">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Rédaction Note</span>
                {CATEGORIES.map((cat) => (
                  <span key={cat.id} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${cat.dot}`} /> {cat.label}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Schedule List Details Column */}
          <div className="space-y-6">
            
            {/* Selected Date Card */}
            <Card className="glass border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px] lg:min-h-[400px]">
              <div className="space-y-6">
                
                {/* Date header label */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" /> PROGRAMME DU JOUR
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                      {selectedDay.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsAddEventOpen(true)}
                    className="h-8 w-8 rounded-lg border border-border bg-accent/50 hover:bg-accent text-foreground shrink-0"
                    title="Planifier un événement pour ce jour"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sub-Section 1: Written Notes */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1 px-1">
                    <FileText className="h-3 w-3" /> Notes rédigées ({notesOnSelectedDay.length})
                  </h4>

                  {notesOnSelectedDay.length === 0 ? (
                    <p className="text-[10px] md:text-xs text-muted-foreground font-mono italic px-2">Aucune note rédigée ce jour.</p>
                  ) : (
                    <div className="space-y-2">
                      {notesOnSelectedDay.map((note) => (
                        <Link key={note.id} href={`/notes?id=${note.id}`}>
                          <div className="p-3 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all flex items-center justify-between group">
                            <span className="text-xs font-bold text-foreground/90 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 truncate pr-3">{note.title}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-Section 2: Events & Active Recall Timeline */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-1 px-1">
                    <CalendarIcon className="h-3 w-3" /> Événements & Tâches ({eventsOnSelectedDay.length})
                  </h4>

                  {eventsOnSelectedDay.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-2xl bg-black/[0.005] dark:bg-white/[0.005] space-y-2 mt-1">
                      <p className="text-[10px] text-muted-foreground font-mono italic text-center">Aucun événement planifié.</p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        onClick={() => setIsAddEventOpen(true)}
                        className="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-bold p-0 h-auto"
                      >
                        + Ajouter un événement
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {eventsOnSelectedDay.map((evt) => {
                        const cat = CATEGORIES.find(c => c.id === evt.category)
                        return (
                          <div key={evt.id} className="p-3 rounded-xl bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 transition-all flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={() => handleToggleEvent(evt.id, evt.completed)}
                                  className="text-muted-foreground hover:text-foreground shrink-0 animate-in"
                                  title={evt.completed ? "Marquer non-effectué" : "Marquer comme fait"}
                                >
                                  {evt.completed ? (
                                    <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
                                  ) : (
                                    <Circle className="h-4.5 w-4.5 text-muted-foreground" />
                                  )}
                                </button>
                                
                                <span className={`text-xs font-bold truncate ${evt.completed ? 'text-muted-foreground line-through' : 'text-foreground/90'}`}>
                                  {evt.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {evt.time && (
                                  <span className="text-[9px] font-mono font-bold bg-accent px-2 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-2 w-2" /> {evt.time}
                                    {evt.reminderOffset > 0 && ` (-${evt.reminderOffset}m)`}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteEvent(evt.id)}
                                  className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400 shrink-0 p-1 transition-colors"
                                  title="Supprimer l'événement"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Optional Details or Associated Note link */}
                            {(evt.description || evt.noteId) && (
                              <div className="pl-6 space-y-1.5 border-l border-border ml-2 pt-0.5">
                                {evt.description && (
                                  <p className="text-[10px] text-muted-foreground leading-relaxed break-words">{evt.description}</p>
                                )}
                                {evt.noteId && (
                                  <Link href={`/notes?id=${evt.noteId}`} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-violet-500 dark:text-violet-400 hover:underline uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded animate-in">
                                    <BookOpen className="h-2.5 w-2.5" /> Note : {evt.noteTitle}
                                  </Link>
                                )}
                              </div>
                            )}

                            {/* Category Pill Tag */}
                            {cat && (
                              <div className="pl-6">
                                <Badge variant="outline" className={`text-[7px] font-mono tracking-widest uppercase px-2 py-0.5 font-bold animate-in ${cat.color}`}>
                                  {cat.label}
                                </Badge>
                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Motivator stats bottom */}
              <div className="pt-6 border-t border-border mt-6 flex items-center gap-3">
                <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-yellow-500 dark:text-yellow-400 animate-pulse" />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground leading-tight">
                  <span className="text-foreground font-semibold">Active Recall & Planning</span> : Structurer vos journées augmente votre productivité de plus de <span className="text-emerald-500 dark:text-emerald-400">40%</span> !
                </div>
              </div>

            </Card>

          </div>

        </div>
      )}
    </div>
  )
}
