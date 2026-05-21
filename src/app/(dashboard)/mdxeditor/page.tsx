"use client";

import React, { useState } from "react";
import { ForwardRefEditor } from "@/components/ui/ForwardRefEditor";
import { Sparkles, Copy, Check, Info } from "lucide-react";
import "@mdxeditor/editor/style.css";

export default function MDXEditorPage() {
  const [markdownContent, setMarkdownContent] = useState(
    `# 🚀 Bienvenue dans l'éditeur MDX d'origine !

Ceci est un document de test rédigé avec **MDXEditor**. 

## ✨ Fonctionnalités de base :
- **Mise en forme :** Utilisez le formatage gras, italique, ou les listes.
- **Raccourcis clavier :** Écrivez en Markdown classique, l'éditeur le convertit en temps réel (WYSIWYG) !
- **Exportation rapide :** Copiez votre contenu en un clic grâce au bouton ci-dessus.

> "Le code est de la poésie écrite pour être exécutée."

N'hésitez pas à modifier ce texte ou à en écrire un nouveau pour essayer la puissance brute de l'éditeur !`
  );
  
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Échec de la copie :", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 px-5 md:px-12 pt-10 pb-32">
      
      {/* En-tête de la page */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-500" />
            Espace MDXEditor
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Découvrez et jouez avec l'éditeur WYSIWYG de Markdown brut d'origine.
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:scale-102 duration-200 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Markdown Copié !
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copier le Markdown
            </>
          )}
        </button>
      </header>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-550/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <span className="font-bold">Astuce MDXEditor d'origine :</span> Cet espace utilise le composant 
          officiel brut de MDXEditor configuré sans modification esthétique externe ou surcharge. 
          Il interprète les raccourcis de style à la volée. Appuyez sur <code className="font-mono bg-blue-100 dark:bg-white/10 px-1 py-0.5 rounded">Espace</code> après un raccourci Markdown (ex: <code className="font-mono bg-blue-100 dark:bg-white/10 px-1 py-0.5 rounded"># </code>) pour le formater visuellement en temps réel.
        </div>
      </div>

      {/* Conteneur de l'éditeur */}
      <div className="bg-white dark:bg-dark-primary rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-md">
        <div className="min-h-[500px] text-gray-800 dark:text-gray-150">
          <ForwardRefEditor
            markdown={markdownContent}
            onChange={setMarkdownContent}
            placeholder="Écrivez votre document en Markdown ici..."
            contentEditableClassName="prose prose-blue dark:prose-invert max-w-none focus:outline-none min-h-[500px] font-sans"
          />
        </div>
      </div>
    </div>
  );
}
