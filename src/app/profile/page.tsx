"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { User, Camera, Loader2, Save, ArrowLeft, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useUser, useAuth } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()
  
  const [displayName, setDisplayName] = React.useState("")
  const [photoURL, setPhotoURL] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")

  const hasPasswordProvider = user?.providerData.some(p => p.providerId === 'password')

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      setDisplayName(user.displayName || "")
      setPhotoURL(user.photoURL || "")
    }
  }, [user, authLoading, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
    if (!apiKey) {
      toast({ variant: "destructive", title: "Configuration manquante", description: "Clé API ImgBB absente." })
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
        toast({ title: "Photo téléchargée", description: "Cliquez sur 'Enregistrer les modifications' pour confirmer." })
      } else {
        throw new Error("Échec de l'upload")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur d'upload", description: "Impossible d'héberger l'image." })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      let profileUpdated = false
      if (displayName !== user.displayName || photoURL !== user.photoURL) {
        await updateProfile(user, {
          displayName: displayName.trim(),
          photoURL: photoURL
        })
        profileUpdated = true
      }

      let passwordUpdated = false
      if (newPassword) {
        if (!currentPassword) {
          toast({ variant: "destructive", title: "Erreur", description: "Veuillez entrer votre mot de passe actuel pour le modifier." })
          setIsSaving(false)
          return
        }
        
        if (!user.email) throw new Error("Email introuvable")
        
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        passwordUpdated = true
        setCurrentPassword("")
        setNewPassword("")
      }

      if (profileUpdated || passwordUpdated) {
        toast({ 
          title: "Profil mis à jour", 
          description: passwordUpdated 
            ? "Vos informations et votre nouveau mot de passe sont enregistrés." 
            : "Vos informations ont été enregistrées avec succès." 
        })
        router.refresh()
      } else {
        toast({ title: "Aucune modification", description: "Aucun changement n'a été détecté." })
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({ variant: "destructive", title: "Mot de passe incorrect", description: "Le mot de passe actuel que vous avez saisi est invalide." })
      } else if (error.code === 'auth/weak-password') {
        toast({ variant: "destructive", title: "Mot de passe faible", description: "Le nouveau mot de passe doit contenir au moins 6 caractères." })
      } else {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le profil." })
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-white h-8 w-8" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6 text-white" />
        </Button>
        <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Mon Profil</h1>
      </div>

      <Card className="glass border-white/5 bg-white/[0.02] overflow-hidden rounded-[2.5rem] shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="relative mx-auto h-32 w-32 mb-6 group">
            <div className="h-full w-full rounded-3xl bg-white/5 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center relative">
              {photoURL ? (
                <Image src={photoURL} alt="Profile" fill className="object-cover" unoptimized />
              ) : (
                <UserIcon className="h-16 w-16 text-white/20" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-transform">
              <Camera className="h-5 w-5 text-black" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>
          <CardTitle className="text-xl text-white">{user?.email}</CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
            ID: {user?.uid}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] px-1">Nom d'affichage</label>
            <Input 
              placeholder="Votre nom ou pseudo..." 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] px-1">URL de la photo (Optionnel)</label>
            <Input 
              placeholder="https://..." 
              value={photoURL} 
              onChange={(e) => setPhotoURL(e.target.value)}
              className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20 text-white text-xs"
            />
          </div>

          {hasPasswordProvider && (
            <>
              <div className="pt-6 pb-2">
                <div className="h-px w-full bg-white/5" />
                <h3 className="text-sm font-bold text-white mt-6">Modifier le mot de passe</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Saisissez votre mot de passe actuel pour éviter d'être déconnecté lors du changement.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] px-1">Mot de passe actuel</label>
                  <Input 
                    type="password"
                    placeholder="Obligatoire pour modifier..." 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] px-1">Nouveau mot de passe</label>
                  <Input 
                    type="password"
                    placeholder="Au moins 6 caractères..." 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20 text-white"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="p-8 bg-white/[0.01] border-t border-white/5 flex justify-end">
          <Button 
            className="bg-white text-black hover:bg-zinc-200 h-12 px-8 rounded-xl font-bold flex items-center gap-2"
            onClick={handleUpdateProfile}
            disabled={isSaving || isUploading}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer les modifications
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
