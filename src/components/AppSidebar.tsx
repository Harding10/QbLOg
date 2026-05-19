"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Plus,
  FileText,
  Files,
  LogOut,
  User as UserIcon,
  Camera,
  Loader2,
  Save,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Zap,
  Sparkles,
  Calendar
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser, useAuth } from "@/firebase"
import { 
  signOut, 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const navigation = [
  { name: "Tableau de Bord", href: "/", icon: LayoutDashboard },
  { name: "Journal Tech", href: "/notes", icon: FileText },
  { name: "Fichiers", href: "/files", icon: Files },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Assistant IA", href: "/ai", icon: Sparkles },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const { toast } = useToast()

  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [displayName, setDisplayName] = React.useState("")
  const [photoURL, setPhotoURL] = React.useState("")
  
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "")
      setPhotoURL(user.photoURL || "")
    }
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
    if (!apiKey) {
      toast({ variant: "destructive", title: "Config manquante", description: "Clé API ImgBB manquante." })
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
        setPhotoURL(result.data.url)
        toast({ title: "Photo téléchargée", description: "Enregistrez pour confirmer le changement." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur d'upload", description: "Impossible d'envoyer l'image." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL
      })

      if (newPassword) {
        if (!oldPassword) {
          toast({ variant: "destructive", title: "Sécurité", description: "Veuillez saisir votre mot de passe actuel." })
          setIsSaving(false)
          return
        }
        if (newPassword.length < 6) {
          toast({ variant: "destructive", title: "Sécurité", description: "Le nouveau mot de passe doit contenir au moins 6 caractères." })
          setIsSaving(false)
          return
        }

        const credential = EmailAuthProvider.credential(user.email!, oldPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword)
        // Force refreshing ID token to keep the session alive automatically!
        await user.getIdToken(true);
      }

      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées avec succès." })
      setOldPassword(""); setNewPassword(""); setConfirmPassword("")
      setIsProfileOpen(false)
    } catch (error: any) {
      let message = "Mise à jour impossible."
      if (error.code === 'auth/wrong-password') message = "Le mot de passe actuel est incorrect."
      toast({ variant: "destructive", title: "Erreur", description: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="h-20 flex items-center justify-center px-4 overflow-hidden">
        <Link href="/" className="flex items-center gap-3 w-full group">
          <div className="h-12 w-12 bg-white flex items-center justify-center rounded-xl shadow-xl shadow-white/5 transition-all group-hover:scale-105 active:scale-95 shrink-0 overflow-hidden relative">
            <img 
              src="/icon.png" 
              alt="Logo" 
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = "flex";
                  fallback.style.alignItems = "center";
                  fallback.style.justifyContent = "center";
                }
              }}
              className="h-full w-full object-cover"
            />
            <span className="font-headline font-bold text-black text-3xl italic hidden">Q</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="font-headline font-bold text-2xl tracking-tighter text-white leading-none">
              QbLog
            </span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1.5">SECOND BRAIN</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarSeparator className="opacity-5 mx-4" />
      
      <SidebarContent className="px-4 py-6">
        <SidebarMenu className="gap-2 md:gap-3">
          {user && (
            <SidebarMenuItem className="mb-2">
              <SidebarMenuButton 
                asChild 
                className="h-12 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all shadow-lg group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
              >
                <Link href="/notes?new=true">
                  <Plus className="h-5 w-5" />
                  <span className="font-bold text-sm tracking-tight">Nouvelle Note</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {navigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.name}
                className="h-12 rounded-xl transition-all duration-200 hover:bg-white/5"
              >
                <Link href={item.href}>
                  <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-white' : 'text-zinc-500'}`} />
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenu className="gap-2">
          {user ? (
            <>
              <SidebarMenuItem>
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DialogTrigger asChild>
                    <button className="flex w-full items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center hover:bg-white/10 transition-colors text-left overflow-hidden">
                       <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden relative border border-white/10">
                         {photoURL ? (
                           <Image src={photoURL} alt="Avatar" fill className="object-cover" unoptimized />
                         ) : (
                           <UserIcon className="h-4 w-4 text-white" />
                         )}
                       </div>
                       <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                         <span className="text-[11px] font-bold text-white truncate">{displayName || user.email?.split('@')[0]}</span>
                         <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">PARAMÈTRES</span>
                       </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 rounded-[2rem] max-w-md p-0 overflow-hidden">
                    <ScrollArea className="max-h-[85vh]">
                      <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-white flex items-center gap-2">
                          <UserIcon className="h-5 w-5" /> Votre Compte
                        </DialogTitle>
                      </DialogHeader>
                      <div className="p-6 space-y-8">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative h-24 w-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shadow-xl">
                            {photoURL ? (
                              <Image src={photoURL} alt="Profil" fill className="object-cover" unoptimized />
                            ) : (
                              <UserIcon className="h-10 w-10 text-white/10" />
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            Changer la photo
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                          </label>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Nom d'affichage</label>
                            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-white/5 border-white/10 h-11" placeholder="Votre nom..." />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400 px-1">Nouveau mot de passe (facultatif)</label>
                            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-white/5 border-white/10 h-11" placeholder="Min. 6 caractères" />
                          </div>
                          {newPassword && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-rose-400 px-1">Mot de passe actuel (requis)</label>
                              <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="bg-white/5 border-white/10 h-11" placeholder="Veuillez saisir votre mot de passe actuel" />
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5">
                        <Button className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold" onClick={handleUpdateProfile} disabled={isSaving || isUploading}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Enregistrer
                        </Button>
                      </DialogFooter>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout} 
                  tooltip="Déconnexion" 
                  className="h-11 rounded-xl text-red-400 hover:bg-red-400/5 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-bold text-sm tracking-tight">Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Se connecter" className="h-12 rounded-xl bg-white/5 text-white">
                <Link href="/login">
                  <UserIcon className="h-5 w-5" />
                  <span className="font-bold text-sm tracking-tight">Connexion</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
