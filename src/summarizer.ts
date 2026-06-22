import type { Config } from './types.js';
import { Semaphore } from './semaphore.js';

const SYSTEM_PROMPT =
  'You summarize Malaysian news articles for a constituency service dashboard. ' +
  'Write exactly one paragraph capturing what happened, who is involved, and why it matters. ' +
  'Respond in the same language as the article. Output only the summary paragraph, no preamble or labels.';

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_CONCURRENT = 3;
const RETRY_DELAY_MS = 1000;

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const sem = new Semaphore(MAX_CONCURRENT);

async function callOpenRouter(
  title: string,
  articleText: string,
  config: Pick<Config, 'openrouterBaseUrl' | 'openrouterApiKey' | 'llmModel'>,
): Promise<{ ok: true; summary: string | null } | { ok: false; retryable: boolean; reason: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openrouterApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Title: ${title}\n\n${articleText}` },
        ],
      }),
    });

    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      return { ok: false, retryable, reason: `HTTP ${res.status}: ${await res.text()}` };
    }

    const data = (await res.json()) as OpenRouterResponse;
    const summary = data.choices?.[0]?.message?.content?.trim() || null;
    return { ok: true, summary };
  } catch (err) {
    return { ok: false, retryable: true, reason: (err as Error).message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function summarizeArticle(
  title: string,
  articleText: string,
  config: Pick<Config, 'openrouterBaseUrl' | 'openrouterApiKey' | 'llmModel'>,
): Promise<string | null> {
  if (!config.openrouterApiKey) {
    return null;
  }

  await sem.acquire();
  try {
    let result = await callOpenRouter(title, articleText, config);
    if (!result.ok && result.retryable) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      result = await callOpenRouter(title, articleText, config);
    }

    if (!result.ok) {
      console.error(`[summarizer] OpenRouter request failed: ${result.reason}`);
      return null;
    }
    return result.summary;
  } finally {
    sem.release();
  }
}
