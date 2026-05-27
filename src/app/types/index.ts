export interface Coordinates {
  lat: number;
  lng: number;
}

export interface EventMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  created_at: string;
  story_count: number;
}

export interface EventPerspectiveResponse {
  event_id: string;
  event_title: string;
  event_coordinates: Coordinates;
  perspectives: Perspective[];
}

export interface Perspective {
  story_id: string;
  created_at: string;
  url: string | null;
  alignment: AlignmentData;
  source: Source;
  article: Article;
}

export interface AlignmentData {
  distance_km: number;
  proximity_score: number;
  relative_position: "local" | "regional" | "global";
}

export interface Source {
  id: string;
  name: string;
  country: string;
  funding_type: string;
  proximity_score: number;
  distance_km: number;
  lat: number;
  lng: number;
}

export interface Article {
  headline: string;
  summary_ai: string;
  editorial_frame: string;
  omitted_context: string;
  content: string;
}
