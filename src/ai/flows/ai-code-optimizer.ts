'use server';
/**
 * @fileOverview An AI assistant for code optimization.
 *
 * - aiCodeOptimizer - A function that suggests optimizations for a given code snippet.
 * - AiCodeOptimizerInput - The input type for the aiCodeOptimizer function.
 * - AiCodeOptimizerOutput - The return type for the aiCodeOptimizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCodeOptimizerInputSchema = z.object({
  codeSnippet: z.string().describe('The code snippet to be optimized.'),
  context: z
    .string()
    .optional()
    .describe(
      'Optional: Additional context or requirements for the code snippet, e.g., "This is part of a React component.", or "Focus on performance.".'
    ),
});
export type AiCodeOptimizerInput = z.infer<typeof AiCodeOptimizerInputSchema>;

const OptimizationSuggestionSchema = z.object({
  type: z
    .enum(['performance', 'readability', 'best-practice', 'security', 'refactoring'])
    .describe('The category of the optimization, e.g., performance, readability, best-practice.'),
  description: z.string().describe('A detailed explanation of the suggested optimization.'),
  lineNumbers: z
    .array(z.number())
    .optional()
    .describe('Optional: Line numbers in the original code snippet where the suggestion applies.'),
  optimizedCodeSnippet: z
    .string()
    .optional()
    .describe('Optional: The suggested optimized code snippet for this specific suggestion.'),
});

const AiCodeOptimizerOutputSchema = z.object({
  summary: z.string().describe('A general summary of the suggested optimizations.'),
  suggestions: z
    .array(OptimizationSuggestionSchema)
    .describe('An array of specific optimization suggestions.'),
});
export type AiCodeOptimizerOutput = z.infer<typeof AiCodeOptimizerOutputSchema>;

export async function aiCodeOptimizer(
  input: AiCodeOptimizerInput
): Promise<AiCodeOptimizerOutput> {
  return aiCodeOptimizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCodeOptimizerPrompt',
  input: {schema: AiCodeOptimizerInputSchema},
  output: {schema: AiCodeOptimizerOutputSchema},
  prompt: `You are an expert software engineer assistant specializing in code optimization, refactoring, and best practices.
Your task is to analyze the provided code snippet and suggest optimizations for performance, readability, adherence to best practices, and security.

Return your response in JSON format according to the output schema provided.

Code Snippet:
"""
{{{codeSnippet}}}
"""

{{#if context}}
Additional Context/Requirements:
{{{context}}}
{{/if}}

Focus on providing clear, actionable suggestions. If a suggestion involves a code change, provide the optimized code snippet. If it applies to specific lines, indicate them.`,
});

const aiCodeOptimizerFlow = ai.defineFlow(
  {
    name: 'aiCodeOptimizerFlow',
    inputSchema: AiCodeOptimizerInputSchema,
    outputSchema: AiCodeOptimizerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get optimization suggestions from AI.');
    }
    return output;
  }
);
