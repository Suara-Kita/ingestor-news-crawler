import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns defaults when no env vars are set', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.QUEUE_VOTER_INPUTS;
    delete process.env.POLL_INTERVAL_MINUTES;
    delete process.env.LOG_LEVEL;
    delete process.env.OPENROUTER_BASE_URL;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.LLM_MODEL;

    const config = loadConfig();

    assert.strictEqual(config.redisHost, 'localhost');
    assert.strictEqual(config.redisPort, 6380);
    assert.strictEqual(config.redisPassword, 'redis');
    assert.strictEqual(config.queueVoterInputs, 'queue:voter_inputs');
    assert.strictEqual(config.pollIntervalMinutes, 30);
    assert.strictEqual(config.logLevel, 'info');
    assert.strictEqual(config.openrouterBaseUrl, 'https://openrouter.ai/api/v1');
    assert.strictEqual(config.openrouterApiKey, '');
    assert.strictEqual(config.llmModel, 'openai/gpt-oss-120b');
  });

  test('redisPort defaults to 6380 (number)', () => {
    delete process.env.REDIS_PORT;

    const config = loadConfig();

    assert.strictEqual(config.redisPort, 6380);
  });

  test('pollIntervalMinutes defaults to 30 (number)', () => {
    delete process.env.POLL_INTERVAL_MINUTES;

    const config = loadConfig();

    assert.strictEqual(config.pollIntervalMinutes, 30);
  });

  test('REDIS_HOST env var overrides the default host', () => {
    process.env.REDIS_HOST = 'custom.redis.host';

    const config = loadConfig();

    assert.strictEqual(config.redisHost, 'custom.redis.host');
  });
});
