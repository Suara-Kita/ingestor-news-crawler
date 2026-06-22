import type { Config } from './types.js';

export function loadConfig(): Config {
  return {
    redisHost: env('REDIS_HOST', 'localhost'),
    redisPort: parseInt(env('REDIS_PORT', '6380'), 10),
    redisPassword: env('REDIS_PASSWORD', 'redis'),
    queueVoterInputs: env('QUEUE_VOTER_INPUTS', 'queue:voter_inputs'),
    pollIntervalMinutes: parseInt(env('POLL_INTERVAL_MINUTES', '30'), 10),
    logLevel: env('LOG_LEVEL', 'info'),
    openrouterBaseUrl: env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    openrouterApiKey: env('OPENROUTER_API_KEY', ''),
    llmModel: env('LLM_MODEL', 'openai/gpt-oss-120b'),
  };
}

function env(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}
