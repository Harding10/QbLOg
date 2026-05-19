
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const auth = getAuth()
  const { toast } = useToast()
  
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [isSignUp, setIsSignUp] = React.useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push("/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      router.push("/")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur d'authentification", description: "Email ou mot de passe incorrect." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      
      <Card className="w-full max-w-md glass border-white/10 shadow-2xl relative z-10 rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-white/5 mb-4">
            <span className="font-headline font-bold text-black text-4xl italic">Q</span>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-white tracking-tighter">
            {isSignUp ? "Créer un compte" : "Bon retour parmi nous"}
          </CardTitle>
          <CardDescription className="text-zinc-500 font-medium">
            {isSignUp ? "Commencez à bâtir votre second cerveau." : "Connectez-vous pour accéder à vos notes techniques."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input 
                  type="password" 
                  placeholder="Mot de passe" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 h-12 rounded-xl focus:ring-white/20"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-base"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? "S'inscrire" : "Se connecter")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-zinc-500 font-bold tracking-widest">Ou</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-3 font-semibold text-white"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} />
            Continuer avec Google
          </Button>
        </CardContent>
        
        <CardFooter className="pb-10 pt-4 flex justify-center border-t border-white/5 mt-6">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-zinc-500 hover:text-white transition-colors underline underline-offset-4"
          >
            {isSignUp ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? Inscrivez-vous"}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
