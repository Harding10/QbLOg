"use client"

import React from "react"
import { Bell, BellOff, BellRing, Check, Shield, ShieldAlert, ShieldCheck, Clock, Tag } from "lucide-react"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

const CATEGORIES: Record<string, { label: string; color: string; dot: string }> = {
  dev: { label: "Développement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  doc: { label: "Documentation", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  review: { label: "Active Recall", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", dot: "bg-violet-400" },
  bug: { label: "Bug à corriger", color: "bg-rose-500/20 text-rose-400 border-rose-500/30", dot: "bg-rose-400" },
  meeting: { label: "Meeting / PR", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  personal: { label: "Personnel / Loisirs", color: "bg-pink-500/20 text-pink-400 border-pink-500/30", dot: "bg-pink-400" },
}

export function NotificationCenter() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // State
  const [isOpen, setIsOpen] = React.useState(false)
  const [permission, setPermission] = React.useState<NotificationPermission>("default")
  const [triggeredIds, setTriggeredIds] = React.useState<string[]>([])
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Load custom permission state & triggered notification ids from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setPermission(Notification.permission)
      }
      const saved = localStorage.getItem("qb_triggered_notifications")
      if (saved) {
        try {
          setTriggeredIds(JSON.parse(saved))
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  // Sync triggeredIds with localStorage
  const updateTriggeredIds = (newIds: string[]) => {
    setTriggeredIds(newIds)
    localStorage.setItem("qb_triggered_notifications", JSON.stringify(newIds))
  }

  // Click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Query all user events
  const eventsQuery = React.useMemo(() => {
    if (!db || !user) return null
    return query(collection(db, "events"), where("userId", "==", user.uid))
  }, [db, user])

  const { data: events } = useCollection<any>(eventsQuery)

  // Helper date formatting (YYYY-MM-DD)
  const getFormatKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const getCurrentTimeString = (date: Date) => {
    const h = String(date.getHours()).padStart(2, "0")
    const m = String(date.getMinutes()).padStart(2, "0")
    return `${h}:${m}`
  }

  // Synth soft premium chime using Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, start)
        
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(start)
        osc.stop(start + duration)
      }

      const now = ctx.currentTime
      playTone(1046.50, now, 0.4) // C6
      playTone(1318.51, now + 0.08, 0.6) // E6
    } catch (e) {
      // Audio context error
    }
  }

  // Trigger Notification Handler
  const triggerNotification = (evt: any) => {
    // 1. Mark as triggered
    const newIds = [...triggeredIds, evt.id]
    updateTriggeredIds(newIds)

    // 2. Play Premium Synthesized chime
    playNotificationChime()

    // 3. Trigger standard Toaster Card
    const offset = evt.reminderOffset || 0
    const timingMessage = offset > 0 
      ? `commence dans ${offset} minutes (${evt.time})` 
      : `commence maintenant`

    toast({
      title: `⏰ Rappel : ${evt.title}`,
      description: evt.description || `Votre tâche ${timingMessage}.`,
      className: "border-blue-500 bg-background/90 backdrop-blur-md"
    })

    // 4. Send browser system Push Notification
    if (permission === "granted") {
      try {
        new Notification(`⏰ Rappel QbLog : ${evt.title}`, {
          body: evt.description || `Votre tâche ${timingMessage}.`,
          icon: "/favicon.ico"
        })
      } catch (err) {
        // block
      }
    }
  }

  // Background reminder checker loop (every 10 seconds)
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (!events || events.length === 0) return

      const now = new Date()
      const todayKey = getFormatKey(now)
      const currentTimeStr = getCurrentTimeString(now)

      const getTriggerTime = (timeStr: string, offsetMinutes: number) => {
        if (!timeStr) return null
        const [hours, minutes] = timeStr.split(":").map(Number)
        const date = new Date()
        date.setHours(hours, minutes - offsetMinutes, 0, 0)
        const h = String(date.getHours()).padStart(2, "0")
        const m = String(date.getMinutes()).padStart(2, "0")
        return `${h}:${m}`
      }

      events.forEach((evt: any) => {
        // Only notify if matching date, valid time slot, and not completed
        if (evt.date === todayKey && evt.time && !evt.completed) {
          const triggerTimeStr = getTriggerTime(evt.time, evt.reminderOffset || 0)
          // Trigger notification if the current time matches calculated trigger time
          if (currentTimeStr === triggerTimeStr && !triggeredIds.includes(evt.id)) {
            triggerNotification(evt)
          }
        }
      })
    }, 10000)

    return () => clearInterval(timer)
  }, [events, triggeredIds, permission])

  // Request browser Notification permission
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "Non pris en charge",
        description: "Les notifications ne sont pas supportées par votre navigateur."
      })
      return
    }

    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res === "granted") {
        toast({
          title: "Notifications Activées !",
          description: "QbLog vous enverra désormais des alertes de bureau."
        })
        playNotificationChime()
      } else {
        toast({
          variant: "destructive",
          title: "Autorisation refusée",
          description: "Vous avez bloqué les notifications de bureau."
        })
      }
    } catch (err) {
      // handle error
    }
  }

  // Filter today's reminders to display in list
  const todayKey = getFormatKey(new Date())
  const todayEvents = React.useMemo(() => {
    if (!events) return []
    return events
      .filter((e: any) => e.date === todayKey)
      .sort((a: any, b: any) => (a.time || "23:59").localeCompare(b.time || "23:59"))
  }, [events, todayKey])

  const pendingRemindersCount = todayEvents.filter((e: any) => !e.completed && !triggeredIds.includes(e.id)).length

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center border transition-all relative active:scale-95 no-print
          ${isOpen 
            ? "border-blue-500/30 bg-blue-500/10 text-blue-400" 
            : "border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          }
        `}
        title="Centre de notifications"
      >
        {pendingRemindersCount > 0 ? (
          <>
            <BellRing className="h-4 w-4 md:h-5 md:w-5 text-blue-400 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-blue-500 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center animate-in zoom-in border-2 border-background shadow-lg">
              {pendingRemindersCount}
            </span>
          </>
        ) : (
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
        )}
      </button>

      {/* Glow effect on hover/active notifications */}
      {pendingRemindersCount > 0 && (
        <span className="absolute -inset-0.5 rounded-xl bg-blue-500/20 blur-sm -z-10 pointer-events-none animate-pulse" />
      )}

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl border border-white/5 bg-background/95 backdrop-blur-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
            <div className="space-y-0.5">
              <h4 className="text-xs md:text-sm font-bold text-foreground">Rappels & Notifications</h4>
              <p className="text-[10px] text-muted-foreground font-medium">Suivi en temps réel de votre agenda</p>
            </div>
            
            {/* Permission status pill */}
            <button
              onClick={requestPermission}
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all no-print hover:scale-105 active:scale-95"
            >
              {permission === "granted" ? (
                <div className="flex items-center gap-1 text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Bureau Actif
                </div>
              ) : permission === "denied" ? (
                <div className="flex items-center gap-1 text-rose-400 border-rose-500/20 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="h-3 w-3" /> Bloqué
                </div>
              ) : (
                <div className="flex items-center gap-1 text-blue-400 border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  <Shield className="h-3 w-3 animate-pulse" /> Activer Bureau
                </div>
              )}
            </button>
          </div>

          {/* Reminders List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5">
            {todayEvents.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <BellOff className="h-8 w-8 text-zinc-600 mx-auto opacity-30" />
                <p className="text-[11px] text-muted-foreground font-mono italic">Aucun rappel planifié pour aujourd'hui.</p>
              </div>
            ) : (
              todayEvents.map((evt) => {
                const cat = CATEGORIES[evt.category]
                const isTriggered = triggeredIds.includes(evt.id)
                
                return (
                  <div 
                    key={evt.id} 
                    className={`p-3 rounded-xl border transition-all flex flex-col gap-1.5
                      ${evt.completed 
                        ? "border-white/5 bg-white/[0.01] opacity-50" 
                        : isTriggered 
                          ? "border-blue-500/20 bg-blue-500/[0.02]" 
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${cat ? cat.dot : "bg-zinc-400"}`} />
                        <span className={`text-xs font-bold truncate ${evt.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {evt.title}
                        </span>
                      </div>
                      
                      {evt.time && (
                        <span className="text-[9px] font-mono font-bold bg-accent px-1.5 py-0.5 rounded text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="h-2 w-2" /> {evt.time}
                          {evt.reminderOffset > 0 && ` (-${evt.reminderOffset}m)`}
                        </span>
                      )}
                    </div>

                    {evt.description && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed truncate pl-4">
                        {evt.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pl-4 pt-1">
                      {cat && (
                        <Badge variant="outline" className={`text-[6px] font-mono tracking-widest uppercase px-1.5 font-bold ${cat.color}`}>
                          {cat.label}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        {evt.completed ? (
                          <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-0.5 uppercase tracking-wider">
                            <Check className="h-2.5 w-2.5" /> Effectué
                          </span>
                        ) : isTriggered ? (
                          <span className="text-[8px] font-bold text-blue-400 flex items-center gap-0.5 uppercase tracking-wider">
                            <span>Notifié</span>
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-zinc-500 flex items-center gap-0.5 uppercase tracking-wider animate-pulse">
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer information */}
          <div className="border-t border-white/5 pt-2.5 mt-2.5 text-[9px] font-bold text-zinc-500 text-center uppercase tracking-widest font-mono">
            Rappels Automatiques Activés
          </div>

        </div>
      )}
    </div>
  )
}
