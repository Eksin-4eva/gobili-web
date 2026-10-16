export interface Comment {
  id: string;
  user_id: string;
  video_id: string;
  parent_id: string;
  child_count: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PagedComments {
  items: Comment[];
  total: number;
}
