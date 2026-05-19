import { techAssistant } from './src/ai/flows/tech-assistant';
import { initializeApp } from 'firebase/app';
// Provide dummy env var
process.env.GEMINI_API_KEY = 'AIzaSyA9FMC1QF-zxyReO7ag3lZXJQpW3q7KKtE';
process.env.GOOGLE_GENAI_API_KEY = 'AIzaSyA9FMC1QF-zxyReO7ag3lZXJQpW3q7KKtE';

async function run() {
  try {
    const res = await techAssistant({ message: "Hello" });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
run();
