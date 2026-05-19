
'use server';
/**
 * @fileOverview Un assistant IA pour structurer et mettre en forme les notes techniques.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NoteStructurerInputSchema = z.object({
  rawContent: z.string().describe('Le contenu brut de la note à structurer.'),
});
export type NoteStructurerInput = z.infer<typeof NoteStructurerInputSchema>;

const NoteStructurerOutputSchema = z.object({
  structuredContent: z.string().describe('Le contenu de la note structuré proprement en Markdown léger.'),
  suggestedTitle: z.string().optional().describe('Un titre technique court suggéré.'),
});
export type NoteStructurerOutput = z.infer<typeof NoteStructurerOutputSchema>;

export async function noteStructurer(input: NoteStructurerInput): Promise<NoteStructurerOutput> {
  return noteStructurerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'noteStructurerPrompt',
  input: {schema: NoteStructurerInputSchema},
  output: {schema: NoteStructurerOutputSchema},
  prompt: `Tu es un expert en documentation technique logicielle. Ton rôle est de prendre un texte brut (souvent des notes de débogage ou des réflexions) et de le mettre en forme proprement sans en altérer le sens original.

Structure le texte de manière professionnelle en utilisant :
- Des titres clairs (ex: ## Contexte, ## Problème, ## Solution/Pistes)
- Des listes à puces pour les étapes
- Des blocs de code si des snippets sont détectés dans le texte brut

Conserve le ton technique mais rend le tout extrêmement lisible.

Contenu brut :
"""
{{{rawContent}}}
"""

Retourne uniquement la version structurée et un titre adapté.`,
});

const noteStructurerFlow = ai.defineFlow(
  {
    name: 'noteStructurerFlow',
    inputSchema: NoteStructurerInputSchema,
    outputSchema: NoteStructurerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) throw new Error('Échec de la structuration par l\'IA.');
    return output;
  }
);
