export interface RssArticle {
  guid?: string;
  link?: string;
  title?: string;
  contentSnippet?: string;
  pubDate?: string;
}

export interface Feed {
  id: string;
  name: string;
  url: string;
}

export interface Config {
  redisHost: string;
  redisPort: number;
  redisPassword: string;
  queueVoterInputs: string;
  logLevel: string;
  openrouterBaseUrl: string;
  openrouterApiKey: string;
  llmModel: string;
}

export interface VoterInput {
  pipeline_metadata: {
    ingestion_id: string;
    source_channel: 'news_crawler';
    ingested_at: string;
    trace_url: string | null;
  };
  source_profile: {
    client_identifier: string;
    display_name: string | null;
    contact_info: null;
    inferred_constituency: null;
  };
  content_payload: {
    raw_text: string;
    content_type: 'text_only';
    media_attachments: string[];
  };
  context_anchor: null;
}
