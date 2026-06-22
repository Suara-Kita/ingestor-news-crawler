import { v4 as uuidv4 } from 'uuid';
import type { RssArticle, Feed, VoterInput } from './types.js';

export function buildVoterInput(
  article: RssArticle,
  feed: Feed,
  bodyText?: string | null,
): VoterInput {
  const body = bodyText
    ? `${article.title ?? ''}\n\n${bodyText}`.trim()
    : [article.title, article.contentSnippet].filter(Boolean).join('\n\n');
  const traceUrl = article.link ?? article.guid ?? null;
  const linkUrl = traceUrl && /^https?:\/\//.test(traceUrl) ? traceUrl : null;
  const rawText = linkUrl ? `${body}\n\nBaca artikel penuh: ${linkUrl}` : body;

  return {
    pipeline_metadata: {
      ingestion_id: uuidv4(),
      source_channel: 'news_crawler',
      ingested_at: new Date().toISOString(),
      trace_url: traceUrl,
    },
    source_profile: {
      client_identifier: feed.id,
      display_name: feed.name,
      contact_info: null,
      inferred_constituency: null,
    },
    content_payload: {
      raw_text: rawText,
      content_type: 'text_only',
      media_attachments: [],
    },
    context_anchor: null,
  };
}
