'use server';
/**
 * @fileOverview Un assistant technique généraliste pour le développement.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TechAssistantInputSchema = z.object({
  message: z.string().describe('Le message de l\'utilisateur.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().describe('L\'historique de la conversation.'),
});
export type TechAssistantInput = z.infer<typeof TechAssistantInputSchema>;

const TechAssistantOutputSchema = z.object({
  reply: z.string().describe('La réponse de l\'assistant au format Markdown.'),
});
export type TechAssistantOutput = z.infer<typeof TechAssistantOutputSchema>;

export async function techAssistant(input: TechAssistantInput): Promise<TechAssistantOutput> {
  return techAssistantFlow(input);
}

const techAssistantFlow = ai.defineFlow(
  {
    name: 'techAssistantFlow',
    inputSchema: TechAssistantInputSchema,
    outputSchema: TechAssistantOutputSchema,
  },
  async (input) => {
    const {text} = await ai.generate({
      system: `Tu es QbLog AI, un assistant technique expert en développement logiciel (Next.js, Firebase, TypeScript, etc.). 
      Tu aides les développeurs à structurer leurs pensées, résoudre des bugs et optimiser leur code. 
      Réponds toujours de manière concise et professionnelle en utilisant le Markdown pour le code.`,
      prompt: input.message,
      // On pourrait passer l'historique ici si on utilisait une interface de chat plus complexe, 
      // mais pour un MVP, on reste sur un échange simple ou concatené.
    });
    return { reply: text || "Désolé, je n'ai pas pu générer de réponse." };
  }
);
