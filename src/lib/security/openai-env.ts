/**
 * Server-only OpenAI credential lookup.
 * Vercel currently stores the sensitive key as OPENAI_API_Key (legacy casing).
 * Prefer the canonical OPENAI_API_KEY when present. Never log the value.
 */

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getOpenAiApiKey(): string | undefined {
  if (typeof window !== "undefined") {
    throw new Error("OpenAI API key must never be accessed from the browser.");
  }
  return (
    trimEnv(process.env.OPENAI_API_KEY) ?? trimEnv(process.env.OPENAI_API_Key)
  );
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(getOpenAiApiKey());
}
