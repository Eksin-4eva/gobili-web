import { getAccessToken, getRefreshToken } from "@/lib/session";
import { getJson } from "@/api/request";
import type { OutgoingSocketMessage, PagedChatHistory } from "@/types/chat";

const CHAT_BASE = (import.meta.env.VITE_CHAT_BASE_URL ?? "").replace(/\/$/, "");

function chatUrl(path: string): string {
  return `${CHAT_BASE}${path}`;
}

export async function getChatHistory(input: {
  peerId: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<PagedChatHistory> {
  const params = new URLSearchParams({
    peer_id: input.peerId,
    page_num: String(input.pageNum ?? 1),
    page_size: String(input.pageSize ?? 50),
  });
  const data = await getJson<PagedChatHistory>(chatUrl(`/history?${params.toString()}`));
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

export function buildChatWsUrl(): string {
  const envUrl = import.meta.env.VITE_CHAT_WS_URL;
  if (envUrl) return envUrl;

  const access = getAccessToken() ?? "";
  const refresh = getRefreshToken() ?? "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const query = new URLSearchParams({ token: access });
  if (refresh) query.set("refresh_token", refresh);
  // 开发期走 Vite 同域代理 /ws
  return `${proto}//${host}/ws?${query.toString()}`;
}

export function connectChatSocket(handlers: {
  onMessage: (msg: OutgoingSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}): WebSocket {
  const ws = new WebSocket(buildChatWsUrl());
  ws.addEventListener("open", () => handlers.onOpen?.());
  ws.addEventListener("close", () => handlers.onClose?.());
  ws.addEventListener("error", () => handlers.onError?.());
  ws.addEventListener("message", (event) => {
    try {
      handlers.onMessage(JSON.parse(String(event.data)) as OutgoingSocketMessage);
    } catch {
      handlers.onMessage({ type: "error", error: "消息解析失败" });
    }
  });
  return ws;
}

export function sendChatMessage(
  ws: WebSocket,
  input: { toUserId: string; content: string; messageType?: string },
): void {
  ws.send(
    JSON.stringify({
      to_user_id: input.toUserId,
      content: input.content,
      message_type: input.messageType ?? "text",
    }),
  );
}
