import type { Feed } from './types.js';

export const FEEDS: Feed[] = [
  { id: 'bharian',      name: 'Berita Harian',          url: 'https://www.bharian.com.my/feed' },
  { id: 'utusan',       name: 'Utusan Malaysia',         url: 'https://www.utusan.com.my/feed' },
  { id: 'sinarharian',  name: 'Sinar Harian',            url: 'https://www.sinarharian.com.my/rssFeed/15' },
  { id: 'nst',          name: 'New Straits Times',       url: 'https://www.nst.com.my/feed' },
  { id: 'fmt',          name: 'Free Malaysia Today',     url: 'https://www.freemalaysiatoday.com/feed' },
  { id: 'tmi',          name: 'The Malaysian Insight',   url: 'https://www.themalaysianinsight.com/feed' },
  { id: 'harakahdaily', name: 'Harakahdaily',            url: 'https://harakahdaily.net/feed/' },
];

const KEYWORDS = [
  'kerajaan', 'pilihan raya', 'parlimen', 'politik', 'menteri', 'bn', 'umno',
  'sekijang', 'pemanis', 'kemelah', 'segamat', 'johor', 'dasar', 'pembangunan',
  'government', 'election', 'parliament', 'minister', 'policy',
  'barisan nasional', 'political', 'constituency',
];

export function matchesFilter(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return KEYWORDS.some((kw) => text.includes(kw));
}
