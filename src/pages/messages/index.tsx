import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import UserMeta from "@/components/UserMeta";
import { getConversations } from "@/api/chat";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hideConversation,
  listConversations,
  listHiddenPeerIds,
  subscribeConversations,
  upsertConversation,
  type ConversationItem,
} from "@/lib/conversations";
import { formatDateTime } from "@/lib/format";

function toUpdatedAt(lastAt: string): number {
  const parsed = Date.parse(lastAt.includes("T") ? lastAt : lastAt.replace(/-/g, "/"));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function mergeConversations(
  serverItems: ConversationItem[],
  localItems: ConversationItem[],
): ConversationItem[] {
  const map = new Map<string, ConversationItem>();
  for (const item of serverItems) {
    map.set(item.peerId, item);
  }
  for (const item of localItems) {
    const prev = map.get(item.peerId);
    if (!prev || item.updatedAt >= prev.updatedAt) {
      map.set(item.peerId, {
        peerId: item.peerId,
        lastContent: item.lastContent || prev?.lastContent || "",
        lastAt: item.lastAt || prev?.lastAt || "",
        updatedAt: Math.max(item.updatedAt, prev?.updatedAt ?? 0),
      });
    }
  }
  return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

function MessagesHome() {
  const navigate = useNavigate();
  const [peerInput, setPeerInput] = useState("");
  const [localItems, setLocalItems] = useState<ConversationItem[]>(() => listConversations());
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => listHiddenPeerIds());

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const data = await getConversations({ pageNum: 1, pageSize: 50 });
      return (data.items ?? []).map((item) => {
        const lastAt = item.last_at || new Date().toISOString();
        return {
          peerId: item.peer_id,
          lastContent: item.last_content || "",
          lastAt,
          updatedAt: toUpdatedAt(lastAt),
        } satisfies ConversationItem;
      });
    },
  });

  useEffect(() => {
    const refresh = () => {
      setLocalItems(listConversations());
      setHiddenIds(listHiddenPeerIds());
    };
    refresh();
    return subscribeConversations(refresh);
  }, []);

  const sorted = useMemo(() => {
    const hidden = new Set(hiddenIds);
    return mergeConversations(conversationsQuery.data ?? [], localItems).filter(
      (item) => !hidden.has(item.peerId),
    );
  }, [conversationsQuery.data, localItems, hiddenIds]);

  const openChat = (peerId: string) => {
    const id = peerId.trim();
    if (!id) {
      $tip("请输入对方用户 ID", "warning");
      return;
    }
    setLocalItems(upsertConversation({ peerId: id }));
    void navigate(`/messages/${id}`);
  };

  if (conversationsQuery.isLoading && sorted.length === 0) {
    return <PageLoading label="加载会话列表..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">私信</h1>
        <p className="text-sm text-muted-foreground">
          会话列表来自服务端；别人发给你的消息也会实时出现在这里
        </p>
      </div>

      <form
        className="flex gap-2 rounded-xl border border-border bg-card p-3"
        onSubmit={(event) => {
          event.preventDefault();
          openChat(peerInput);
        }}
      >
        <Input
          value={peerInput}
          onChange={(e) => setPeerInput(e.target.value)}
          placeholder="输入对方用户 ID 开始聊天"
        />
        <Button type="submit">开始聊天</Button>
      </form>

      {conversationsQuery.isError ? (
        <EmptyState title="会话列表加载失败" description="请稍后重试，或先通过用户 ID 开始聊天" />
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          title="还没有会话"
          description="等待别人发消息，或去用户主页点「发私信」"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {sorted.map((item) => (
            <div
              key={item.peerId}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40"
            >
              <Link to={`/messages/${item.peerId}`} className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <UserMeta userId={item.peerId} />
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {item.lastAt ? formatDateTime(item.lastAt) : ""}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {item.lastContent || "暂无消息，点击进入会话"}
                </p>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHiddenIds(hideConversation(item.peerId))}
              >
                移除
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesHome />
    </AuthGuard>
  );
}
