import { getStoredUser } from "@/lib/session";

export interface ConversationItem {
  peerId: string;
  lastContent: string;
  lastAt: string;
  updatedAt: number;
}

type ConversationListener = () => void;

const listeners = new Set<ConversationListener>();

function storageKey(): string | null {
  const user = getStoredUser();
  if (!user?.id) return null;
  return `gobili.conversations.${user.id}`;
}

function notifyConversations(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeConversations(listener: ConversationListener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith("gobili.conversations.")) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function listConversations(): ConversationItem[] {
  const key = storageKey();
  if (!key) return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ConversationItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.peerId === "string" && item.peerId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function upsertConversation(input: {
  peerId: string;
  lastContent?: string;
  lastAt?: string;
}): ConversationItem[] {
  const key = storageKey();
  if (!key || !input.peerId) return [];

  const now = Date.now();
  const current = listConversations();
  const existing = current.find((item) => item.peerId === input.peerId);
  const nextItem: ConversationItem = {
    peerId: input.peerId,
    lastContent: input.lastContent?.trim() || existing?.lastContent || "",
    lastAt: input.lastAt || existing?.lastAt || new Date().toISOString(),
    updatedAt: now,
  };

  const next = [nextItem, ...current.filter((item) => item.peerId !== input.peerId)];
  localStorage.setItem(key, JSON.stringify(next));
  // 有新消息时自动取消隐藏，避免收信后列表里还看不到
  const hidden = listHiddenPeerIds().filter((id) => id !== input.peerId);
  const hiddenStorageKey = hiddenKey();
  if (hiddenStorageKey) {
    localStorage.setItem(hiddenStorageKey, JSON.stringify(hidden));
  }
  notifyConversations();
  return next;
}

export function removeConversation(peerId: string): ConversationItem[] {
  const key = storageKey();
  if (!key) return [];
  const next = listConversations().filter((item) => item.peerId !== peerId);
  localStorage.setItem(key, JSON.stringify(next));
  notifyConversations();
  return next;
}

/** 根据一条收发消息，推断会话对方 ID */
export function peerIdFromMessage(input: {
  myUserId: string;
  fromUserId?: string;
  toUserId?: string;
}): string | null {
  const myUserId = String(input.myUserId ?? "").trim();
  const fromUserId = String(input.fromUserId ?? "").trim();
  const toUserId = String(input.toUserId ?? "").trim();
  if (!myUserId) return null;
  if (!fromUserId && !toUserId) return null;
  if (fromUserId && fromUserId !== myUserId) return fromUserId;
  if (toUserId && toUserId !== myUserId) return toUserId;
  return null;
}


function hiddenKey(): string | null {
  const user = getStoredUser();
  if (!user?.id) return null;
  return `gobili.conversations.hidden.${user.id}`;
}

export function listHiddenPeerIds(): string[] {
  const key = hiddenKey();
  if (!key) return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function hideConversation(peerId: string): string[] {
  const key = hiddenKey();
  if (!key || !peerId) return listHiddenPeerIds();
  const next = Array.from(new Set([...listHiddenPeerIds(), peerId]));
  localStorage.setItem(key, JSON.stringify(next));
  notifyConversations();
  return next;
}

export function unhideConversation(peerId: string): string[] {
  const key = hiddenKey();
  if (!key || !peerId) return listHiddenPeerIds();
  const next = listHiddenPeerIds().filter((id) => id !== peerId);
  localStorage.setItem(key, JSON.stringify(next));
  notifyConversations();
  return next;
}
