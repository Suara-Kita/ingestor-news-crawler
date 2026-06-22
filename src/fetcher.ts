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

export function filterArticles(articles: RssArticle[]): RssArticle[] {
  return articles.filter((a) => matchesFilter(a.title ?? '', a.contentSnippet ?? ''));
}
