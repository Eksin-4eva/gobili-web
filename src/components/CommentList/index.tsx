import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteComment, listComments, publishComment } from "@/api/comment";
import { ApiError } from "@/api/apiError";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import UserMeta from "@/components/UserMeta";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { isLoggedIn } from "@/lib/session";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Comment } from "@/types/comment";

function CommentItem({
  comment,
  videoId,
}: {
  comment: Comment;
  videoId: string;
}) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [openReplies, setOpenReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [content, setContent] = useState("");

  const repliesQuery = useQuery({
    queryKey: ["comments", videoId, comment.id],
    enabled: openReplies,
    queryFn: () => listComments({ videoId, commentId: comment.id }),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <UserMeta
            userId={comment.user_id}
            showTime
            timeText={formatDateTime(comment.created_at)}
          />
          <p className="text-sm leading-relaxed">{comment.content}</p>
        </div>
        {user?.id === comment.user_id ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await deleteComment(comment.id);
                $tip("已删除", "success");
                await invalidate();
              } catch (error) {
                $tip(error instanceof ApiError ? error.message : "删除失败", "error");
              }
            }}
          >
            删除
          </Button>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2">
        {comment.child_count > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setOpenReplies((v) => !v)}>
            {openReplies ? "收起回复" : `查看 ${comment.child_count} 条回复`}
          </Button>
        ) : null}
        {isLoggedIn() ? (
          <Button variant="ghost" size="sm" onClick={() => setReplying((v) => !v)}>
            回复
          </Button>
        ) : null}
      </div>
      {replying ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下回复"
          />
          <Button
            size="sm"
            onClick={async () => {
              try {
                await publishComment({ videoId, content, commentId: comment.id });
                setContent("");
                setReplying(false);
                setOpenReplies(true);
                $tip("回复成功", "success");
                await invalidate();
                await repliesQuery.refetch();
              } catch (error) {
                $tip(error instanceof ApiError ? error.message : "回复失败", "error");
              }
            }}
          >
            发送回复
          </Button>
        </div>
      ) : null}
      {openReplies ? (
        repliesQuery.isLoading ? (
          <PageLoading label="加载回复..." />
        ) : (
          <div className="mt-3 space-y-3 border-l border-border pl-3">
            {(repliesQuery.data?.items ?? []).map((item) => (
              <div key={item.id} className="space-y-1.5">
                <UserMeta
                  userId={item.user_id}
                  compact
                  showTime
                  timeText={formatDateTime(item.created_at)}
                />
                <p className="text-sm">{item.content}</p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export default function CommentList({ videoId }: { videoId: string }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const query = useQuery({
    queryKey: ["comments", videoId],
    queryFn: () => listComments({ videoId }),
  });

  const mutation = useMutation({
    mutationFn: () => publishComment({ videoId, content }),
    onSuccess: async () => {
      setContent("");
      $tip("评论成功", "success");
      await queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
    onError: (error) => {
      $tip(error instanceof ApiError ? error.message : "评论失败", "error");
    },
  });

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">评论</h2>
      {user ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserMeta userId={user.id} compact />
            <span className="text-xs text-muted-foreground">以该身份发表评论</span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="友善发言"
          />
          <Button
            disabled={!content.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            发表评论
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          登录后可评论；登录后也能看到评论者头像与用户名
        </p>
      )}

      {query.isLoading ? (
        <PageLoading />
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="还没有评论" />
      ) : (
        <div className="space-y-3">
          {query.data!.items.map((comment) => (
            <CommentItem key={comment.id} comment={comment} videoId={videoId} />
          ))}
        </div>
      )}
    </section>
  );
}
