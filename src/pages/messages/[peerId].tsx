import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import PageLoading from "@/components/PageLoading";
import UserMeta from "@/components/UserMeta";
import { useChatSocket } from "@/components/ChatSocketProvider";
import { getChatHistory } from "@/api/chat";
import { peerIdFromMessage, upsertConversation } from "@/lib/conversations";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateTime } from "@/lib/format";
import type { ChatHistoryItem } from "@/types/chat";

function ChatRoom() {
  const { peerId = "" } = useParams();
  const { user } = useCurrentUser();
  const { connState, sendMessage, subscribe } = useChatSocket();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const myId = user?.id ?? "";

  const historyQuery = useQuery({
    queryKey: ["chat-history", peerId],
    enabled: Boolean(peerId),
    queryFn: () => getChatHistory({ peerId }),
  });

  useEffect(() => {
    if (!peerId) return;
    upsertConversation({ peerId });
  }, [peerId]);

  useEffect(() => {
    if (historyQuery.data) {
      setMessages([...(historyQuery.data.items ?? [])].reverse());
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (!peerId || !myId) return;

    return subscribe((msg) => {
      if (msg.type === "error") {
        $tip(msg.error || "聊天错误", "error");
        return;
      }
      if (msg.type !== "message" && msg.type !== "ack") return;
      if (!msg.id || !msg.content) return;

      const inferredPeer =
        peerIdFromMessage({
          myUserId: myId,
          fromUserId: msg.from_user_id,
          toUserId: msg.to_user_id,
        }) || "";

      // 只展示当前会话双方的消息
      if (inferredPeer !== peerId) return;

      const createdAt = msg.sent_at ?? new Date().toISOString();
      setMessages((prev) => {
        if (prev.some((item) => item.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id!,
            from_user_id: String(msg.from_user_id ?? ""),
            to_user_id: String(msg.to_user_id ?? ""),
            content: msg.content!,
            created_at: createdAt,
          },
        ];
      });
    });
  }, [peerId, myId, subscribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      case "idle":
        return "未登录";
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
          const mine = item.from_user_id === myId;
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
        <div ref={bottomRef} />
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const content = text.trim();
          if (!content) return;
          if (!sendMessage({ toUserId: peerId, content })) {
            $tip("连接未就绪", "warning");
            return;
          }
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
