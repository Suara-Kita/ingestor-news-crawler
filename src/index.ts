import 'dotenv/config';
import { loadConfig } from './config.js';
import { getRedis, isAlreadySeen, markSeen, pushToQueue, incrementCounter } from './redis.js';
import { FEEDS } from './feeds.js';
import { fetchFeed, filterArticles } from './fetcher.js';
import { buildVoterInput } from './normalizer.js';
import { initBrowser, closeBrowser, scrapeArticleBody } from './scraper.js';
import { summarizeArticle } from './summarizer.js';
import type { Browser } from 'playwright';

async function pollOnce(
  redis: ReturnType<typeof getRedis>,
  config: ReturnType<typeof loadConfig>,
  browser: Browser,
): Promise<void> {
  await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const articles = await fetchFeed(feed);
        const filtered = filterArticles(articles);
        console.log(`[${feed.id}] fetched ${articles.length}, ${filtered.length} passed filter`);

        await Promise.allSettled(
          filtered.map(async (article) => {
            const articleId = article.guid ?? article.link ?? '';
            if (!articleId) {
              console.warn(`[${feed.id}] article has no guid or link, skipping`);
              return;
            }
            try {
              const seen = await isAlreadySeen(redis, articleId);
              if (seen) {
                console.log(`[${feed.id}] skip (dedup): ${article.title?.slice(0, 80)}`);
                return;
              }
              const scrapedBody = article.link
                ? await scrapeArticleBody(browser, article.link)
                : null;
              const summary = scrapedBody
                ? await summarizeArticle(article.title ?? '', scrapedBody, config)
                : null;
              const [bodyText, source] = summary
                ? [summary, 'summarized']
                : scrapedBody
                  ? [scrapedBody, 'scraped']
                  : [null, 'rss'];
              const voterInput = buildVoterInput(article, feed, bodyText);
              await pushToQueue(redis, config.queueVoterInputs, JSON.stringify(voterInput));
              await markSeen(redis, articleId);
              await incrementCounter(redis, 'stats:news-crawler:articles_ingested');
              console.log(`[${feed.id}] pushed (${source}): ${article.title?.slice(0, 70)}`);
            } catch (err) {
              console.error(
                `[${feed.id}] error for "${article.title?.slice(0, 60)}":`,
                (err as Error).message,
              );
            }
          }),
        );
      } catch (err) {
        console.error(`[${feed.id}] fetch error:`, (err as Error).message);
      }
    }),
  );
}

function msUntilNext9AM(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function main(): Promise<void> {
  const config = loadConfig();
  const redis = getRedis(config);
  const browser = await initBrowser();

  const shutdown = async () => {
    console.log('[news-crawler] shutting down...');
    await closeBrowser(browser);
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  if (!config.openrouterApiKey) {
    console.warn('[news-crawler] OPENROUTER_API_KEY not set — summarization disabled, falling back to raw scraped text');
  }

  console.log(`[poll] running immediately on startup`);
  await pollOnce(redis, config, browser);
  console.log(`[poll] cycle done`);

  while (true) {
    const delay = msUntilNext9AM();
    const nextRun = new Date(Date.now() + delay);
    console.log(`[news-crawler] next fetch scheduled at ${nextRun.toLocaleString()} (in ${Math.round(delay / 60000)}min)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log(`[poll] cycle start at ${new Date().toISOString()}`);
    await pollOnce(redis, config, browser);
    console.log(`[poll] cycle done`);
  }
}

main().catch((err) => {
  console.error('[news-crawler] fatal:', err);
  process.exit(1);
});
