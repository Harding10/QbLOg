'use server';
/**
 * @fileOverview An AI debugging assistant that analyzes error logs and code snippets to provide solutions and debugging steps.
 *
 * - aiDebuggingAssistant - A function that handles the AI debugging process.
 * - AiDebuggingAssistantInput - The input type for the aiDebuggingAssistant function.
 * - AiDebuggingAssistantOutput - The return type for the aiDebuggingAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDebuggingAssistantInputSchema = z.object({
  errorLog: z.string().describe('The error log to be analyzed.'),
  codeSnippet: z.string().describe('The relevant code snippet where the error occurred.'),
});
export type AiDebuggingAssistantInput = z.infer<typeof AiDebuggingAssistantInputSchema>;

const AiDebuggingAssistantOutputSchema = z.object({
  solutions: z.array(z.string()).describe('A list of potential solutions or debugging steps.'),
  explanation: z.string().describe('A detailed explanation of the problem and the reasoning behind the suggested solutions.'),
});
export type AiDebuggingAssistantOutput = z.infer<typeof AiDebuggingAssistantOutputSchema>;

export async function aiDebuggingAssistant(input: AiDebuggingAssistantInput): Promise<AiDebuggingAssistantOutput> {
  return aiDebuggingAssistantFlow(input);
}

const aiDebuggingAssistantPrompt = ai.definePrompt({
  name: 'aiDebuggingAssistantPrompt',
  input: {schema: AiDebuggingAssistantInputSchema},
  output: {schema: AiDebuggingAssistantOutputSchema},
  prompt: `You are an expert software engineer and a debugging assistant. Your goal is to analyze an error log and a code snippet to provide clear, actionable solutions and a comprehensive explanation.

Analyze the following error log and code snippet. Identify the root cause of the error and suggest specific steps to resolve it.

Error Log:
"""
{{{errorLog}}}
"""

Code Snippet:
"""
{{{codeSnippet}}}
"""

Provide your analysis and suggestions in a structured JSON format, including a list of potential solutions/debugging steps and a detailed explanation.`,
});

const aiDebuggingAssistantFlow = ai.defineFlow(
  {
    name: 'aiDebuggingAssistantFlow',
    inputSchema: AiDebuggingAssistantInputSchema,
    outputSchema: AiDebuggingAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await aiDebuggingAssistantPrompt(input);
    return output!;
  }
);
