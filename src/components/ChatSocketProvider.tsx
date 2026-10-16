import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connectChatSocket, sendChatMessage as sendRawChatMessage } from "@/api/chat";
import {
  peerIdFromMessage,
  upsertConversation,
} from "@/lib/conversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { OutgoingSocketMessage } from "@/types/chat";

export type ChatConnState = "idle" | "connecting" | "connected" | "disconnected" | "error";

type ChatMessageListener = (msg: OutgoingSocketMessage) => void;

interface ChatSocketContextValue {
  connState: ChatConnState;
  sendMessage: (input: { toUserId: string; content: string }) => boolean;
  subscribe: (listener: ChatMessageListener) => () => void;
}

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null);

/**
 * 登录后维持一条全局 WebSocket：
 * - 别人发来的消息写入本地会话列表
 * - 聊天页订阅同一条连接，实时展示收发消息
 */
export default function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const [connState, setConnState] = useState<ChatConnState>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const myIdRef = useRef<string | null>(null);
  const listenersRef = useRef(new Set<ChatMessageListener>());

  useEffect(() => {
    myIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const emit = useCallback((msg: OutgoingSocketMessage) => {
    listenersRef.current.forEach((listener) => listener(msg));
  }, []);

  const rememberConversation = useCallback((msg: OutgoingSocketMessage) => {
    if (msg.type !== "message" && msg.type !== "ack") return;
    if (!msg.content) return;
    const myId = myIdRef.current;
    if (!myId) return;

    const peerId = peerIdFromMessage({
      myUserId: myId,
      fromUserId: msg.from_user_id,
      toUserId: msg.to_user_id,
    });
    if (!peerId) return;

    upsertConversation({
      peerId,
      lastContent: msg.content,
      lastAt: msg.sent_at ?? new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      wsRef.current?.close();
      wsRef.current = null;
      setConnState("idle");
      return;
    }

    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const attempt = retryRef.current;
      retryRef.current = attempt + 1;
      const delay = Math.min(10000, 1000 * 2 ** Math.min(attempt, 3));
      timerRef.current = window.setTimeout(() => {
        if (!cancelled) connect();
      }, delay);
    };

    const connect = () => {
      clearTimer();
      if (cancelled) return;
      setConnState("connecting");

      const ws = connectChatSocket({
        onOpen: () => {
          retryRef.current = 0;
          setConnState("connected");
        },
        onClose: () => {
          if (cancelled) return;
          setConnState((prev) => (prev === "error" ? prev : "disconnected"));
          scheduleReconnect();
        },
        onError: () => {
          if (!cancelled) setConnState("error");
        },
        onMessage: (msg) => {
          if (msg.type === "connected") {
            setConnState("connected");
            emit(msg);
            return;
          }
          if (msg.type === "message" || msg.type === "ack") {
            rememberConversation(msg);
            emit(msg);
            return;
          }
          emit(msg);
        },
      });
      wsRef.current = ws;
    };

    connect();

    return () => {
      cancelled = true;
      clearTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [user?.id, emit, rememberConversation]);

  const subscribe = useCallback((listener: ChatMessageListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const sendMessage = useCallback((input: { toUserId: string; content: string }) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    sendRawChatMessage(ws, input);
    upsertConversation({
      peerId: input.toUserId,
      lastContent: input.content,
      lastAt: new Date().toISOString(),
    });
    return true;
  }, []);

  const value = useMemo(
    () => ({ connState, sendMessage, subscribe }),
    [connState, sendMessage, subscribe],
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket(): ChatSocketContextValue {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error("useChatSocket must be used within ChatSocketProvider");
  }
  return ctx;
}
