import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildVoterInput } from '../src/normalizer.js';
import type { RssArticle, Feed } from '../src/types.js';

const testFeed: Feed = {
  id: 'bharian',
  name: 'Berita Harian',
  url: 'https://www.bharian.com.my/rss',
};

const baseArticle: RssArticle = {
  guid: 'article1',
  link: 'https://example.com/article1',
  title: 'Test Article',
  contentSnippet: 'Test snippet',
};

describe('buildVoterInput', () => {
  test('pipeline_metadata.source_channel is news_crawler', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    assert.strictEqual(result.pipeline_metadata.source_channel, 'news_crawler');
  });

  test('pipeline_metadata.ingestion_id is a valid UUID v4', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    assert.match(result.pipeline_metadata.ingestion_id, uuidV4Regex);
  });

  test('pipeline_metadata.ingested_at is a valid ISO string', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    const iso = result.pipeline_metadata.ingested_at;
    assert.match(iso, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    assert.ok(!isNaN(new Date(iso).getTime()));
  });

  test('pipeline_metadata.trace_url is article.link when link is present', () => {
    const article: RssArticle = {
      guid: 'article1-guid',
      link: 'https://example.com/article1',
      title: 'Test Article',
      contentSnippet: 'Test snippet',
    };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(result.pipeline_metadata.trace_url, 'https://example.com/article1');
  });

  test('pipeline_metadata.trace_url falls back to article.guid when link is absent', () => {
    const article: RssArticle = {
      guid: 'article1-guid',
      title: 'Test Article',
      contentSnippet: 'Test snippet',
    };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(result.pipeline_metadata.trace_url, 'article1-guid');
  });

  test('pipeline_metadata.trace_url is null when both link and guid are absent', () => {
    const article: RssArticle = {
      title: 'Test Article',
      contentSnippet: 'Test snippet',
    };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(result.pipeline_metadata.trace_url, null);
  });

  test('source_profile.client_identifier is the feed id (no prefix)', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    assert.strictEqual(result.source_profile.client_identifier, 'bharian');
  });

  test('source_profile.display_name is the feed name', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    assert.strictEqual(result.source_profile.display_name, 'Berita Harian');
  });

  test('source_profile.contact_info is null', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    assert.strictEqual(result.source_profile.contact_info, null);
  });

  test('content_payload.raw_text joins title and contentSnippet, with link appended', () => {
    const article: RssArticle = {
      guid: 'article1',
      link: 'https://example.com/article1',
      title: 'Test Title',
      contentSnippet: 'Test Snippet',
    };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(
      result.content_payload.raw_text,
      'Test Title\n\nTest Snippet\n\nBaca artikel penuh: https://example.com/article1',
    );
  });

  test('content_payload.raw_text skips undefined/falsy parts but still appends link', () => {
    const article: RssArticle = {
      guid: 'article1',
      link: 'https://example.com/article1',
      title: 'Test Title',
      contentSnippet: undefined,
    };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(
      result.content_payload.raw_text,
      'Test Title\n\nBaca artikel penuh: https://example.com/article1',
    );
  });

  test('content_payload.raw_text has no link line when there is no link or guid', () => {
    const article: RssArticle = { title: 'Test Title', contentSnippet: 'Test Snippet' };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(result.content_payload.raw_text, 'Test Title\n\nTest Snippet');
  });

  test('content_payload.raw_text has no link line when guid is not a URL', () => {
    const article: RssArticle = {
      guid: 'article1-guid',
      title: 'Test Title',
      contentSnippet: 'Test Snippet',
    };
    const result = buildVoterInput(article, testFeed);
    assert.strictEqual(result.content_payload.raw_text, 'Test Title\n\nTest Snippet');
  });

  test('context_anchor is null', () => {
    const result = buildVoterInput(baseArticle, testFeed);
    assert.strictEqual(result.context_anchor, null);
  });

  test('raw_text uses bodyText when provided, with link appended', () => {
    const article: RssArticle = { title: 'Test Title', link: 'https://example.com/1' };
    const result = buildVoterInput(article, testFeed, 'Full article body text here.');
    assert.strictEqual(
      result.content_payload.raw_text,
      'Test Title\n\nFull article body text here.\n\nBaca artikel penuh: https://example.com/1',
    );
  });

  test('raw_text falls back to RSS snippet when bodyText is null', () => {
    const article: RssArticle = { title: 'Test Title', contentSnippet: 'RSS snippet', link: 'https://example.com/1' };
    const result = buildVoterInput(article, testFeed, null);
    assert.strictEqual(
      result.content_payload.raw_text,
      'Test Title\n\nRSS snippet\n\nBaca artikel penuh: https://example.com/1',
    );
  });

  test('raw_text falls back to RSS snippet when bodyText is undefined', () => {
    const article: RssArticle = { title: 'Test Title', contentSnippet: 'RSS snippet', link: 'https://example.com/1' };
    const result = buildVoterInput(article, testFeed, undefined);
    assert.strictEqual(
      result.content_payload.raw_text,
      'Test Title\n\nRSS snippet\n\nBaca artikel penuh: https://example.com/1',
    );
  });
});
