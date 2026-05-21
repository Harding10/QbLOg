'use client';

import GeneratorInput from '@/components/generator/generator-input';
import { RenderMessage } from '@/components/generator/render-message';
import { GradientBlob } from '@/components/gradient-blob';
import { useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { useState } from 'react';
import { useAuth } from "@/context/AuthContext";

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
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-50">
              👋 Bonjour, {user?.displayName || "YOYO"} !
            </h1>
          </header>
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
