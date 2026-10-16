import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import PageLoading from "@/components/PageLoading";
import { connectChatSocket, getChatHistory, sendChatMessage } from "@/api/chat";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateTime } from "@/lib/format";
import type { ChatHistoryItem } from "@/types/chat";

function ChatRoom() {
  const { peerId = "" } = useParams();
  const { user } = useCurrentUser();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const historyQuery = useQuery({
    queryKey: ["chat-history", peerId],
    enabled: Boolean(peerId),
    queryFn: () => getChatHistory({ peerId }),
  });

  useEffect(() => {
    if (historyQuery.data) {
      setMessages([...(historyQuery.data.items ?? [])].reverse());
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (!peerId) return;
    const ws = connectChatSocket({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: () => setConnected(false),
      onMessage: (msg) => {
        if (msg.type === "error") {
          $tip(msg.error || "聊天错误", "error");
          return;
        }
        if (msg.type === "message" || msg.type === "ack") {
          if (!msg.id || !msg.content) return;
          setMessages((prev) => {
            if (prev.some((item) => item.id === msg.id)) return prev;
            return [
              ...prev,
              {
                id: msg.id!,
                from_user_id: String(msg.from_user_id ?? ""),
                to_user_id: String(msg.to_user_id ?? ""),
                content: msg.content!,
                created_at: msg.sent_at ?? new Date().toISOString(),
              },
            ];
          });
        }
      },
    });
    wsRef.current = ws;
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [peerId]);

  const status = useMemo(() => (connected ? "已连接" : "连接中..."), [connected]);

  if (historyQuery.isLoading) return <PageLoading label="加载历史消息..." />;

  return (
    <div className="mx-auto flex h-[70vh] max-w-2xl flex-col rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="font-semibold">与 {peerId} 的会话</h1>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((item) => {
          const mine = item.from_user_id === user?.id;
          return (
            <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p>{item.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                  {formatDateTime(item.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            $tip("连接未就绪", "warning");
            return;
          }
          sendChatMessage(wsRef.current, { toUserId: peerId, content: text.trim() });
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="输入消息" />
        <Button type="submit">发送</Button>
      </form>
    </div>
  );
}

export default function MessageRoomPage() {
  return (
    <AuthGuard>
      <ChatRoom />
    </AuthGuard>
  );
}
