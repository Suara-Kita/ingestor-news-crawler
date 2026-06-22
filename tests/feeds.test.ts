import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FEEDS, matchesFilter } from '../src/feeds.js';

describe('FEEDS', () => {
  test('should have exactly 7 entries', () => {
    assert.strictEqual(FEEDS.length, 7);
  });

  test('all feeds should have non-empty id, name, and url', () => {
    for (const feed of FEEDS) {
      assert.ok(feed.id.length > 0, `Feed id should not be empty`);
      assert.ok(feed.name.length > 0, `Feed name should not be empty`);
      assert.ok(feed.url.length > 0, `Feed url should not be empty`);
    }
  });

  test('all feed URLs should start with https://', () => {
    for (const feed of FEEDS) {
      assert.ok(feed.url.startsWith('https://'), `Feed URL should start with https://: ${feed.url}`);
    }
  });

  test('feed IDs should be unique', () => {
    const ids = FEEDS.map((feed) => feed.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size, 'Feed IDs should be unique');
  });
});

describe('matchesFilter', () => {
  test('should return true for Malay keyword in title', () => {
    assert.strictEqual(matchesFilter('kerajaan baru', ''), true);
  });

  test('should return true for English keyword in description', () => {
    assert.strictEqual(matchesFilter('', 'government election'), true);
  });

  test('should return true for constituency keyword', () => {
    assert.strictEqual(matchesFilter('sekijang constituency news', ''), true);
  });

  test('should return false for non-political keywords', () => {
    assert.strictEqual(matchesFilter('recipe for nasi lemak', 'cooking tips'), false);
  });

  test('should be case-insensitive', () => {
    assert.strictEqual(matchesFilter('POLITIK MALAYSIA', ''), true);
  });
});
