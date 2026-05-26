export interface AnalyzeEventResponse {
  event_id: string;
  event_title: string;
  perspectives: Perspective[];
}

export interface Perspective {
  source: Source;
  article: Article;
}

export interface Source {
  name: string;
  country: string;
  funding_type: string;
  proximity_score: number;
}

export interface Article {
  headline: string;
  summary_ai: string;
  editorial_frame: string;
  omitted_context: string;
}
