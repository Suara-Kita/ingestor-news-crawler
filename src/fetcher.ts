import Parser from 'rss-parser';
import type { RssArticle, Feed } from './types.js';
import { matchesFilter } from './feeds.js';

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'SuaraKita-NewsCrawler/1.0' },
});

export async function fetchFeed(feed: Feed): Promise<RssArticle[]> {
  const result = await parser.parseURL(feed.url);
  return result.items.map((item) => ({
    guid: item.guid ?? item.link,
    link: item.link,
    title: item.title,
    contentSnippet: item.contentSnippet,
    pubDate: item.pubDate,
  }));
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function filterArticles(articles: RssArticle[]): RssArticle[] {
  const cutoff = Date.now() - ONE_DAY_MS;
  return articles.filter((a) => {
    if (!a.pubDate) return false;
    const pub = new Date(a.pubDate).getTime();
    if (isNaN(pub) || pub < cutoff) return false;
    return matchesFilter(a.title ?? '', a.contentSnippet ?? '');
  });
}
