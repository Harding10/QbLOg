"use client"

import { 
  Sparkles, 
  Plus,
  ArrowRight,
  LayoutGrid,
  Zap,
  FileText,
  Terminal,
  ShieldCheck,
  BrainCircuit,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, limit, where, orderBy } from "firebase/firestore";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { UserProfileAvatar } from "@/components/UserProfileAvatar";

export default function Home() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()

  const { data: allNotes, loading: notesLoading } = useCollection<any>(React.useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "notes"), where("userId", "==", user.uid));
  }, [db, user]));

  const recentNotes = React.useMemo(() => {
    if (!allNotes) return [];
    return [...allNotes]
      .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))
      .slice(0, 4);
  }, [allNotes]);

  const filesQuery = React.useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "files"),
      where("userId", "==", user.uid)
    );
  }, [db, user]);

  const { data: allFiles } = useCollection<any>(filesQuery);


  if (userLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin opacity-20" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto space-y-16 md:space-y-24 py-12 md:py-24 px-4">
        <section className="text-center space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white tracking-[0.2em] uppercase">
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-400" /> Bienvenue sur QbLog
          </div>
          <h1 className="text-4xl md:text-8xl font-headline font-bold text-white tracking-tighter leading-tight md:leading-none">
            Votre second cerveau <br className="hidden md:block" /> technique.
          </h1>
          <p className="text-zinc-500 text-base md:text-2xl max-w-2xl mx-auto leading-relaxed">
            L'outil de documentation ultime pour développeurs. Capturez vos idées, vos bouts de code et vos solutions, structurés par l'IA.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 text-base md:text-lg font-bold shadow-2xl">
                Commencer gratuitement
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-base md:text-lg font-bold">
              Découvrir les fonctionnalités
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
           <FeatureCard 
             icon={BrainCircuit} 
             title="Structure IA" 
             desc="Transformez vos brouillons en documentation structurée en un clic." 
           />
           <FeatureCard 
             icon={ShieldCheck} 
             title="Sécurisé & Privé" 
             desc="Vos notes sont stockées en toute sécurité et ne sont accessibles que par vous." 
           />
           <FeatureCard 
             icon={Terminal} 
             title="Code & Terminal" 
             desc="Support natif pour les extraits de code et les commandes système." 
           />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 py-4 md:py-8 animate-in fade-in duration-700">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 md:px-0">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <UserProfileAvatar className="h-14 w-14 md:h-20 md:w-20 rounded-2xl md:rounded-3xl border-2 border-white/5 shadow-2xl" iconClassName="h-6 w-6 md:h-8 md:w-8" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <Zap className="h-3 w-3 text-yellow-400" /> RÉCAPITULATIF DE VOTRE BASE
              </div>
              <h1 className="text-2xl md:text-6xl font-headline font-bold text-white tracking-tighter leading-none">Flux Actif.</h1>
            </div>
          </div>
          <p className="text-zinc-500 text-sm md:text-xl max-w-lg leading-relaxed">
            Bonjour, {user.displayName || user.email?.split('@')[0]}. Voici l'état de vos connaissances techniques.
          </p>
        </div>
        <Link href="/notes?new=true" className="w-full md:w-auto">
          <Button className="w-full md:w-auto bg-white text-black hover:bg-zinc-200 h-14 md:h-20 px-6 md:px-14 rounded-xl md:rounded-3xl shadow-2xl text-base md:text-xl font-bold transition-all hover:scale-105 active:scale-95">
            <Plus className="mr-2 md:mr-3 h-5 w-5 md:h-8 md:w-8" />
            Nouvelle Note
          </Button>
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> notes récentes
            </h3>
            <Link href="/notes" className="text-[10px] md:text-xs text-zinc-500 hover:text-white transition-colors underline underline-offset-4 font-bold">Voir tout</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {notesLoading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-44 rounded-[2rem] bg-white/[0.02] border border-white/5 animate-pulse" />)
            ) : recentNotes.length === 0 ? (
              <div className="col-span-full py-12 md:py-24 text-center glass rounded-[2rem] md:rounded-[3rem] border-dashed border-white/10 space-y-6">
                 <div className="h-12 w-12 md:h-16 md:w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-white/10" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-white/40 font-bold">Votre journal est vide</p>
                    <p className="text-zinc-600 text-[10px] md:text-xs max-w-[200px] mx-auto">Commencez par documenter une solution ou un bug rencontré aujourd'hui.</p>
                 </div>
              </div>
            ) : recentNotes.map((note) => (
              <Link key={note.id} href={`/notes?id=${note.id}`}>
                <Card className="glass border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] hover:bg-white/[0.04] transition-all group overflow-hidden h-full shadow-lg hover:shadow-white/5">
                  <CardContent className="p-4 md:p-7 space-y-4 md:space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 min-w-0">
                        <Badge variant="outline" className="text-[8px] md:text-[9px] border-blue-500/20 text-blue-400 font-mono font-bold tracking-widest px-2 py-0.5">VOTRE NOTE</Badge>
                        <h4 className="font-bold text-base md:text-xl text-white truncate leading-none mt-2">{note.title}</h4>
                      </div>
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-blue-500/20 transition-colors shrink-0">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-zinc-700 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                    <p className="text-[10px] md:text-xs text-zinc-500 line-clamp-3 leading-relaxed font-mono bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                      {note.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2">
                        {note.description.includes('```') && (
                          <span className="flex items-center gap-1 text-[7px] md:text-[9px] px-2 py-0.5 md:py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/10 font-bold uppercase tracking-wider">
                            <Terminal className="h-2 w-2" /> Code
                          </span>
                        )}
                      </div>
                      <span className="text-[8px] md:text-[10px] text-zinc-600 font-mono font-bold">
                        {note.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'À l\'instant'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-white text-black rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 space-y-6 md:space-y-10 shadow-2xl relative group h-full md:max-h-[550px] overflow-hidden border-none flex flex-col justify-between">
             <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:scale-125 transition-all duration-1000">
               <Sparkles className="h-48 w-48 md:h-64 md:w-64" />
             </div>
             <div className="space-y-4 md:space-y-5 relative flex flex-col items-center md:items-start text-center md:text-left">
               <div className="h-10 w-10 md:h-12 md:w-12 bg-black rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                 <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
               </div>
               <h3 className="text-2xl md:text-4xl font-bold tracking-tighter leading-tight">Statistiques Globales.</h3>
               <p className="text-xs md:text-base opacity-70 leading-relaxed font-medium">
                 Toutes vos données sont liées à votre compte. Seul vous pouvez voir et modifier vos notes techniques.
               </p>
             </div>
             
             <div className="grid grid-cols-2 gap-3 md:gap-4 relative w-full">
                <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-black/5 border border-black/5 text-center md:text-left flex flex-col items-center md:items-start justify-center">
                   <div className="text-3xl md:text-5xl font-mono font-bold tracking-tighter">{allNotes?.length || 0}</div>
                   <div className="text-[7px] md:text-[8px] uppercase font-bold tracking-[0.2em] opacity-40 mt-1">Notes</div>
                </div>
                <div className="p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-black/5 border border-black/5 text-center md:text-left flex flex-col items-center md:items-start justify-center">
                   <div className="text-3xl md:text-5xl font-mono font-bold tracking-tighter">{allFiles?.length || 0}</div>
                   <div className="text-[7px] md:text-[8px] uppercase font-bold tracking-[0.2em] opacity-40 mt-1">Fichiers</div>
                </div>
             </div>

             <div className="pt-6 md:pt-8 border-t border-black/10 relative flex items-center justify-between">
               <div className="flex -space-x-2">
                  <UserProfileAvatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white" />
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/5 border-2 border-white flex items-center justify-center text-[8px] md:text-[10px] font-bold">
                    +{(allNotes?.length || 0) + (allFiles?.length || 0)}
                  </div>
               </div>
               <Link href="/notes?new=true">
                 <Button size="icon" className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-3xl bg-black text-white hover:bg-zinc-800 shadow-2xl transition-transform hover:scale-110">
                   <ArrowRight className="h-5 w-5 md:h-8 md:w-8" />
                 </Button>
               </Link>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center space-y-4">
      <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
      <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
