export interface Video {
  id: string;
  user_id: string;
  video_url: string;
  cover_url: string;
  title: string;
  description: string;
  visit_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PagedVideos {
  items: Video[];
  total: number;
}

export interface SearchVideosPayload {
  keywords?: string;
  from_date?: number;
  to_date?: number;
  username?: string;
  page_num?: number;
  page_size?: number;
}
