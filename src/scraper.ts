import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Semaphore } from './semaphore.js';

const SCRAPE_TIMEOUT_MS = 20_000;
const MAX_CONCURRENT = 3;

const sem = new Semaphore(MAX_CONCURRENT);

export async function initBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close();
}

export async function scrapeArticleBody(browser: Browser, url: string): Promise<string | null> {
  await sem.acquire();
  let page: Page | null = null;
  try {
    page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: SCRAPE_TIMEOUT_MS });
    const html = await page.content();
    const virtualConsole = new VirtualConsole();
    const dom = new JSDOM(html, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return article?.textContent?.trim() ?? null;
  } catch (err) {
    console.error(`[scraper] failed ${url}:`, (err as Error).message);
    return null;
  } finally {
    await page?.close();
    sem.release();
  }
}
