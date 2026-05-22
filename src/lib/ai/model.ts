import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '',
});

export const AI_MODEL = google('gemini-1.5-flash');
