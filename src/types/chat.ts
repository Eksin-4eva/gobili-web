export interface ChatHistoryItem {
  id: string;
  room_id?: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
}

export interface PagedChatHistory {
  items: ChatHistoryItem[];
  total: number;
}

export type OutgoingSocketMessage =
  | { type: "connected" }
  | {
      type: "message" | "ack";
      id?: string;
      room_id?: string;
      from_user_id?: string;
      to_user_id?: string;
      content?: string;
      sent_at?: string;
      online?: boolean;
    }
  | { type: "error"; error?: string };
