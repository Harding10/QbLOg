import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    // Appel direct de l'API de Gemini (100% sécurisé côté serveur)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze the following programming code snippet and identify its language. Return ONLY the lowercased name of the language (for example: javascript, typescript, python, css, html, bash, sql, json, java, cpp, csharp, go, ruby, rust, php, yaml). Do not include any formatting, markdown markers, quotes, descriptions or other characters. Just return the language name as a plain string. If you cannot identify the language or if it is simple text, return 'plaintext'.\n\nCode snippet:\n${code}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 15
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error details:", errText);
      return NextResponse.json({ error: "Failed to detect language from Gemini API" }, { status: 520 });
    }

    const data = await response.json();
    let detectedLanguage = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toLowerCase() || 'plaintext';
    
    // Nettoyer d'éventuelles marques de markdown ou retours à la ligne
    detectedLanguage = detectedLanguage.replace(/[`'"]/g, '').trim();

    return NextResponse.json({ language: detectedLanguage });
  } catch (error) {
    console.error("Language detection error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
