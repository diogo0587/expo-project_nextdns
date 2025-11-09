import { useCallback } from 'react';
import { useApiConfig } from './apiContext';

type GeminiContent = {
  role: 'user' | 'model';
  parts: Array<{ text?: string }>;
};

type GeminiRequest = {
  contents: GeminiContent[];
};

export function useGemini() {
  const {
    config: { geminiApiKey, geminiModel },
  } = useApiConfig();

  const ensureConfig = useCallback(() => {
    if (!geminiApiKey) {
      throw new Error('Configure Gemini API key in Settings.');
    }
  }, [geminiApiKey]);

  const summarizeText = useCallback(
    async (text: string) => {
      ensureConfig();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(
        geminiApiKey
      )}`;
      const body: GeminiRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Gemini error (${res.status}): ${t}`);
      }
      const json = await res.json();
      const out =
        json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ??
        'No response';
      return out as string;
    },
    [ensureConfig, geminiApiKey, geminiModel]
  );

  return { summarizeText };
}