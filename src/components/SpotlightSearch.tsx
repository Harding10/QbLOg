"use client"

import * as React from "react"
import { 
  Search as SearchIcon, 
  Command as CommandIcon, 
  Book as BookIcon,
  Loader2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useUser } from "@/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { useRouter } from "next/navigation"

export function SpotlightSearch() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    const performSearch = async () => {
      if (!search.trim() || !db || !user) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const q = query(
          collection(db, "notes"),
          where("userId", "==", user.uid),
          limit(10)
        )
        const snapshot = await getDocs(q)
        const filtered = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((note: any) => 
            note.title?.toLowerCase().includes(search.toLowerCase()) || 
            note.description?.toLowerCase().includes(search.toLowerCase())
          )
        setResults(filtered)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [search, db, user])

  const handleSelect = (noteId: string) => {
    setOpen(false)
    router.push(`/notes?id=${noteId}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-sm items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-white/10 hover:border-white/20"
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4" />
          <span>Rechercher dans vos notes...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 glass border-white/10 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="sr-only">Recherche Spotlight</DialogTitle>
            <div className="flex items-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <SearchIcon className="h-5 w-5 text-muted-foreground" />}
              <Input
                placeholder="Tapez pour rechercher dans vos notes..."
                className="border-none bg-transparent focus-visible:ring-0 text-lg p-0 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {results.length > 0 ? (
                <div className="px-2 py-2">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Notes trouvées</h3>
                  <div className="space-y-1">
                    {results.map((note) => (
                      <SearchItem 
                        key={note.id} 
                        icon={BookIcon} 
                        title={note.title} 
                        category="Note" 
                        onClick={() => handleSelect(note.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : search.trim() && !loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune note ne correspond à votre recherche.
                </div>
              ) : (
                <div className="px-2 py-2">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Accès rapide</h3>
                  <div className="space-y-1">
                    <SearchItem icon={CommandIcon} title="Ouvrir l'assistant IA" category="Action" onClick={() => { setOpen(false); router.push('/ai'); }} />
                    <SearchItem icon={CommandIcon} title="Voir tous les fichiers" category="Action" onClick={() => { setOpen(false); router.push('/files'); }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SearchItem({ icon: Icon, title, category, onClick }: { icon: any, title: string, category: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5 text-left group"
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-white" />
      <span className="flex-1 text-foreground group-hover:text-white truncate">{title}</span>
      <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{category}</span>
    </button>
  )
}