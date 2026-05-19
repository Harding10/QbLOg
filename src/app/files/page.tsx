"use client"

import * as React from "react"
import { 
  Folder, 
  File, 
  Files,
  Plus, 
  Search, 
  ChevronRight, 
  Upload, 
  MoreHorizontal, 
  Trash2, 
  FolderPlus,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Move,
  Home
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, where, orderBy, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function FilesPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [isAddingFolder, setIsAddingFolder] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  
  const [draggedItem, setDraggedItem] = React.useState<{ id: string, type: 'file' | 'folder' } | null>(null)
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null)

  const folderRef = React.useMemo(() => (db && currentFolderId ? doc(db, "folders", currentFolderId) : null), [db, currentFolderId])
  const { data: currentFolder } = useDoc<any>(folderRef)

  const foldersQuery = React.useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "folders"),
      where("userId", "==", user.uid),
      where("parentId", "==", currentFolderId)
    )
  }, [db, user, currentFolderId])

  const filesQuery = React.useMemo(() => {
    if (!db || !user) return null
    return query(
      collection(db, "files"),
      where("userId", "==", user.uid),
      where("folderId", "==", currentFolderId)
    )
  }, [db, user, currentFolderId])

  const { data: folders, loading: foldersLoading } = useCollection<any>(foldersQuery)
  const { data: files, loading: filesLoading } = useCollection<any>(filesQuery)

  const handleCreateFolder = () => {
    if (!db || !user || !newFolderName.trim()) return
    
    const folderData = {
      name: newFolderName.trim(),
      parentId: currentFolderId,
      userId: user.uid,
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, "folders"), folderData)
      .then(() => {
        toast({ title: "Dossier créé" })
        setNewFolderName("")
        setIsAddingFolder(false)
      })
      .catch(async (error) => {
        console.error("Folder creation error:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'folders',
          operation: 'create',
          requestResourceData: folderData
        }));
      })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !db || !user) return

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
    if (!apiKey) {
      toast({ variant: "destructive", title: "Configuration manquante", description: "Clé API ImgBB manquante." })
      return
    }

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
        const fileData = {
          name: file.name,
          url: result.data.url,
          type: file.type,
          size: file.size,
          folderId: currentFolderId,
          userId: user.uid,
          createdAt: serverTimestamp()
        }

        addDoc(collection(db, "files"), fileData)
          .then(() => {
            toast({ title: "Fichier importé" })
          })
          .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: 'files',
              operation: 'create',
              requestResourceData: fileData
            }));
          })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur réseau" })
    } finally {
      setIsUploading(false)
      if (e.target) e.target.value = ""
    }
  }

  const handleMove = (itemId: string, itemType: 'file' | 'folder', targetFolderId: string | null) => {
    if (!db || !user || itemId === targetFolderId) return
    
    const collectionName = itemType === 'folder' ? "folders" : "files"
    const updateField = itemType === 'folder' ? "parentId" : "folderId"
    
    const itemRef = doc(db, collectionName, itemId)
    const updateData = { [updateField]: targetFolderId }
    
    updateDoc(itemRef, updateData)
      .then(() => {
        toast({ title: "Élément déplacé" })
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `${collectionName}/${itemId}`,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
  }

  const handleDelete = (id: string, type: 'folder' | 'file') => {
    if (!db) return
    const collectionName = type === 'folder' ? "folders" : "files"
    
    deleteDoc(doc(db, collectionName, id))
      .then(() => {
        toast({ title: type === 'folder' ? "Dossier supprimé" : "Fichier supprimé" })
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `${collectionName}/${id}`,
          operation: 'delete'
        }));
      })
  }

  const onDragStart = (e: React.DragEvent, id: string, type: 'file' | 'folder') => {
    setDraggedItem({ id, type })
    e.dataTransfer.setData("application/json", JSON.stringify({ id, type }))
  }

  const onDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    if (draggedItem && draggedItem.id !== folderId) {
      setDropTargetId(folderId)
    }
  }

  const onDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    setDropTargetId(null)
    const dataString = e.dataTransfer.getData("application/json")
    if (!dataString) return
    
    try {
      const { id, type } = JSON.parse(dataString)
      handleMove(id, type, targetFolderId)
    } catch (e) {
    }
    setDraggedItem(null)
  }

  const filteredFolders = folders?.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
  const filteredFiles = files?.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8 px-2 md:px-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Files className="h-5 w-5 md:h-6 md:w-6 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight">Base de Fichiers</h1>
              <p className="text-muted-foreground text-[10px] md:text-sm">Gérez vos ressources techniques par glisser-déposer.</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-muted-foreground bg-white/5 w-fit px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 max-w-full overflow-x-auto">
            <button 
              onClick={() => setCurrentFolderId(null)}
              onDragOver={(e) => onDragOver(e, null)}
              onDrop={(e) => onDrop(e, null)}
              className={cn(
                "hover:text-white transition-colors flex items-center gap-1.5 shrink-0",
                dropTargetId === null && draggedItem ? "text-blue-400 scale-110" : ""
              )}
            >
              <Home className="h-3 w-3" /> Racine
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
                <span className="text-white bg-white/10 px-2 py-0.5 rounded-md truncate max-w-[150px]">{currentFolder.name}</span>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 lg:flex-none border-white/10 bg-white/5 rounded-xl h-10 md:h-11 text-xs md:text-sm">
                <FolderPlus className="mr-1.5 md:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nouveau Dossier</span>
                <span className="sm:hidden">Dossier</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 rounded-2xl w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Dossier dans {currentFolder?.name || "la racine"}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  placeholder="Nom du dossier..." 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)}
                  className="bg-white/5 border-white/10 h-12"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsAddingFolder(false)}>Annuler</Button>
                <Button onClick={handleCreateFolder} className="bg-white text-black hover:bg-zinc-200">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 lg:flex-none">
            <Input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
            <Button className="w-full lg:w-auto bg-white text-black hover:bg-zinc-200 rounded-xl h-10 md:h-11 px-4 md:px-6 shadow-lg shadow-white/5 text-xs md:text-sm" disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importer
            </Button>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-white transition-colors" />
        <Input 
          placeholder="Rechercher dans ce dossier..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-11 h-11 md:h-12 bg-white/5 border-white/10 rounded-xl md:rounded-2xl focus-visible:ring-white/10 text-xs md:text-sm"
        />
      </div>

      <div className="flex flex-col gap-2 md:gap-3">
        {foldersLoading || filesLoading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl md:rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />)
        ) : (
          <>
            {filteredFolders?.map(folder => (
              <div 
                key={folder.id} 
                draggable
                onDragStart={(e) => onDragStart(e, folder.id, 'folder')}
                onDragOver={(e) => onDragOver(e, folder.id)}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => onDrop(e, folder.id)}
                className={cn(
                  "group relative rounded-xl md:rounded-2xl border transition-all flex items-center justify-between p-3 md:p-4 cursor-pointer overflow-hidden",
                  dropTargetId === folder.id 
                    ? "bg-blue-500/20 border-blue-500/50 scale-[1.01] shadow-2xl shadow-blue-500/20" 
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                )}
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-zinc-500/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <Folder className={cn(
                      "h-5 w-5 transition-colors",
                      dropTargetId === folder.id ? "text-blue-400" : "text-zinc-500"
                    )} />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-white truncate pr-4">{folder.name}</span>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white/5 border border-white/10">
                        <MoreHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-white/10">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }} className="text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredFiles?.map(file => (
              <div 
                key={file.id} 
                draggable
                onDragStart={(e) => onDragStart(e, file.id, 'file')}
                className="group relative rounded-xl md:rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all flex items-center justify-between p-3 md:p-4 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 relative overflow-hidden transition-transform group-hover:scale-110">
                    {file.type && file.type.startsWith('image') ? (
                      <Image src={file.url} alt={file.name} fill className="object-cover opacity-60 group-hover:opacity-100 transition-all" unoptimized />
                    ) : (
                      <File className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <span className="text-xs md:text-sm font-bold text-zinc-400 truncate group-hover:text-white transition-colors pr-4">{file.name}</span>
                </div>
                
                <div className="flex items-center gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hidden sm:block">
                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white/5 border border-white/10">
                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                    </Button>
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white/5 border border-white/10">
                        <MoreHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-white/10">
                      <DropdownMenuItem asChild>
                         <a href={file.url} target="_blank" rel="noopener noreferrer" className="sm:hidden">
                            <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir
                         </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(file.id, 'file')} className="text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </>
        )}

        {!foldersLoading && !filesLoading && filteredFolders?.length === 0 && filteredFiles?.length === 0 && (
          <div className="col-span-full py-12 md:py-24 text-center glass rounded-[2rem] md:rounded-[3rem] border-dashed border-white/10 flex flex-col items-center justify-center space-y-4 md:space-y-6">
            <div className="h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5">
              <Files className="h-6 w-6 md:h-10 md:w-10 text-zinc-800" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base md:text-xl font-bold text-white/50">Ce dossier est vide</h3>
              <p className="text-muted-foreground text-[10px] md:text-sm max-w-[200px] md:max-w-xs mx-auto">
                Importez un fichier technique ou créez un sous-dossier.
              </p>
            </div>
            {currentFolderId && (
              <Button variant="outline" onClick={() => setCurrentFolderId(null)} className="rounded-xl border-white/10 bg-white/5 h-9 md:h-11 text-xs">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
            )}
          </div>
        )}
      </div>
      
      {draggedItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-full font-bold shadow-2xl shadow-blue-500/40 flex items-center gap-2 md:gap-3 animate-in slide-in-from-bottom-10 z-50 text-[10px] md:text-sm">
          <Move className="h-3 w-3 md:h-4 md:w-4 animate-bounce" />
          Déplacement...
          <span className="hidden sm:inline text-[8px] md:text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">Glissez sur une cible</span>
        </div>
      )}
    </div>
  )
}
