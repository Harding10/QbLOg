'use client';

import GeneratorInput from '@/components/generator/generator-input';
import { RenderMessage } from '@/components/generator/render-message';
import { GradientBlob } from '@/components/gradient-blob';
import { useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Bug, Upload, Code } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const [isThinking, setIsThinking] = useState(false);
  const { user } = useAuth();

  const chatHandler = useChat({
    generateId: createIdGenerator({ prefix: 'msgc' }),
    sendExtraMessageFields: true,
    onResponse: () => setIsThinking(false),
  });

  return (
    <div className="contents">
      {chatHandler.messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-5 md:px-12 pt-10 pb-32">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Bonjour, {user?.displayName || "Développeur"} ! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Bienvenue dans votre Second Cerveau Technique. Prêt à être productif aujourd'hui ?
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/journal" className="block border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-transform hover:scale-[1.02] bg-white dark:bg-dark-primary shadow-sm">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nouvelle Note</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Rédigez dans votre journal technique avec support Markdown.</p>
                </Link>

                <Link href="/bugs" className="block border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-transform hover:scale-[1.02] bg-white dark:bg-dark-primary shadow-sm">
                  <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-4">
                    <Bug className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Signaler un Bug</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ouvrez un nouveau ticket dans votre kanban de suivi.</p>
                </Link>

                <Link href="/files" className="block border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-transform hover:scale-[1.02] bg-white dark:bg-dark-primary shadow-sm">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Uploader Fichier</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ajoutez des documents ou images à votre base locale.</p>
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-primary shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Activité Récente</h3>
              <div className="h-40 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                Vos dernières notes apparaîtront ici.
              </div>
            </div>
          </section>
        </div>
      ) : (
        <RenderMessage useChat={chatHandler} isThinking={isThinking} />
      )}

      <div className="px-5 md:px-12">
        <form
          onSubmit={(e) => {
            setIsThinking(true);
            chatHandler.handleSubmit(e);
          }}
        >
          <GeneratorInput
            value={chatHandler.input}
            onChange={chatHandler.handleInputChange}
          />
        </form>

        <GradientBlob />
      </div>
    </div>
  );
}
