"use client"

import * as React from "react"
import { Bug, Sparkles, Terminal, Code2, Send, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { aiDebuggingAssistant, type AiDebuggingAssistantOutput } from "@/ai/flows/ai-debugging-assistant"
import { useToast } from "@/hooks/use-toast"

export default function DebuggerPage() {
  const { toast } = useToast()
  const [errorLog, setErrorLog] = React.useState("")
  const [codeSnippet, setCodeSnippet] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<AiDebuggingAssistantOutput | null>(null)

  const handleDebug = async () => {
    if (!errorLog.trim()) {
      toast({
        variant: "destructive",
        title: "Champ manquant",
        description: "Veuillez entrer au moins un log d'erreur."
      })
      return
    }

    setLoading(true)
    try {
      const response = await aiDebuggingAssistant({
        errorLog,
        codeSnippet: codeSnippet || "Aucun extrait de code fourni."
      })
      setResult(response)
      toast({
        title: "Analyse terminée",
        description: "L'IA a généré des pistes de solution."
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erreur d'analyse",
        description: "L'assistant n'a pas pu traiter votre demande."
      })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setErrorLog("")
    setCodeSnippet("")
    setResult(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/5">
            <Bug className="h-7 w-7 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-white">Débugueur IA</h1>
            <p className="text-muted-foreground">Analyse instantanée de vos erreurs de compilation et runtime.</p>
          </div>
        </div>
        <Button variant="outline" onClick={reset} className="border-white/10 bg-white/5">
          <RefreshCw className="mr-2 h-4 w-4" /> Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="glass border-white/5 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Log d'Erreur
              </CardTitle>
              <CardDescription>Collez ici le message d'erreur ou la stacktrace.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Ex: TypeError: Cannot read property 'map' of undefined..."
                className="min-h-[150px] bg-black/40 border-white/10 font-mono text-xs"
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="glass border-white/5 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Extrait de Code (Optionnel)
              </CardTitle>
              <CardDescription>Fournissez le contexte du fichier concerné.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Collez le snippet de code ici..."
                className="min-h-[150px] bg-black/40 border-white/10 font-mono text-xs"
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button 
            className="w-full h-12 bg-white text-black hover:bg-zinc-200 text-base font-bold rounded-xl"
            onClick={handleDebug}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {loading ? "Analyse en cours..." : "Lancer le Débogage IA"}
          </Button>
        </div>

        <div className="flex flex-col">
          {result ? (
            <Card className="flex-1 glass border-white/10 bg-white/[0.03] overflow-hidden flex flex-col">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2 text-green-400">
                  <Sparkles className="h-5 w-5" />
                  <CardTitle>Résultats de l'Analyse</CardTitle>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                      Explication
                    </h3>
                    <p className="text-zinc-400 leading-relaxed">{result.explanation}</p>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Send className="h-5 w-5 text-green-400" />
                      Solutions Suggérées
                    </h3>
                    <div className="grid gap-3">
                      {result.solutions.map((solution, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300">
                          <span className="font-bold text-white mr-2">{idx + 1}.</span>
                          {solution}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </Card>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                <Bug className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white/50">Prêt pour l'analyse</h3>
                <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                  Collez vos logs à gauche pour recevoir des suggestions intelligentes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
