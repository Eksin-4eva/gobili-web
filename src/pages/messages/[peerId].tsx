import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import PageLoading from "@/components/PageLoading";
import UserMeta from "@/components/UserMeta";
import { connectChatSocket, getChatHistory, sendChatMessage } from "@/api/chat";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateTime } from "@/lib/format";
import type { ChatHistoryItem } from "@/types/chat";

type ConnState = "connecting" | "connected" | "disconnected" | "error";

function ChatRoom() {
  const { peerId = "" } = useParams();
  const { user } = useCurrentUser();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [connState, setConnState] = useState<ConnState>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);

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
    unmountedRef.current = false;
    if (!peerId) return;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (unmountedRef.current) return;
      const attempt = retryRef.current;
      retryRef.current = attempt + 1;
      const delay = Math.min(10000, 1000 * 2 ** Math.min(attempt, 3));
      timerRef.current = window.setTimeout(() => {
        if (!unmountedRef.current) connect();
      }, delay);
    };

    const connect = () => {
      clearTimer();
      if (unmountedRef.current) return;
      setConnState("connecting");

      const ws = connectChatSocket({
        onOpen: () => {
          retryRef.current = 0;
          setConnState("connected");
        },
        onClose: () => {
          if (unmountedRef.current) return;
          setConnState((prev) => (prev === "error" ? prev : "disconnected"));
          scheduleReconnect();
        },
        onError: () => {
          if (unmountedRef.current) return;
          setConnState("error");
        },
        onMessage: (msg) => {
          if (msg.type === "connected") {
            setConnState("connected");
            return;
          }
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
    };

    connect();

    return () => {
      unmountedRef.current = true;
      clearTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [peerId]);

  const statusText = useMemo(() => {
    switch (connState) {
      case "connected":
        return "已连接";
      case "connecting":
        return "连接中...";
      case "disconnected":
        return "已断开，正在重连...";
      case "error":
        return "连接失败，正在重试...";
      default:
        return "连接中...";
    }
  }, [connState]);

  if (historyQuery.isLoading) return <PageLoading label="加载历史消息..." />;

  return (
    <div className="mx-auto flex h-[70vh] max-w-2xl flex-col rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">与</span>
            <UserMeta userId={peerId} compact />
            <span className="font-semibold">的会话</span>
          </div>
          <p className="text-xs text-muted-foreground">{statusText}</p>
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
