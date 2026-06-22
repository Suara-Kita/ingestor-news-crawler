import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeArticle } from '../src/summarizer.js';

describe('summarizeArticle', () => {
  test('returns null without making a network call when openrouterApiKey is empty', async () => {
    const result = await summarizeArticle('Title', 'Article body text.', {
      openrouterBaseUrl: 'https://openrouter.ai/api/v1',
      openrouterApiKey: '',
      llmModel: 'openai/gpt-oss-120b',
    });
    assert.strictEqual(result, null);
  });
});
