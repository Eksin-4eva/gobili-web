import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import CommentList from "@/components/CommentList";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import { getFeed, getPopular, visitVideo } from "@/api/video";
import { formatCount, formatDateTime } from "@/lib/format";
import { isLoggedIn } from "@/lib/session";
import type { Video } from "@/types/video";

function useVideo(id: string, stateVideo?: Video) {
  return useQuery({
    queryKey: ["video", id],
    initialData: stateVideo,
    queryFn: async () => {
      if (stateVideo && stateVideo.id === id) return stateVideo;
      const [feed, popular] = await Promise.all([getFeed(), getPopular(1, 50)]);
      const found =
        feed.find((item) => item.id === id) ||
        popular.items.find((item) => item.id === id);
      if (!found) throw new Error("not found");
      return found;
    },
  });
}

export default function VideoDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const stateVideo = (location.state as { video?: Video } | null)?.video;
  const query = useVideo(id, stateVideo);

  useEffect(() => {
    if (!id || !isLoggedIn() || !query.data) return;
    const key = `gobili.visited.${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void visitVideo(id).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, [id, query.data]);

  if (query.isLoading) return <PageLoading label="加载视频..." />;
  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="找不到该视频"
        description="后端暂无单视频详情接口，请从列表进入；刷新后可能丢失缓存"
      />
    );
  }

  const video = query.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          <video
            className="aspect-video w-full"
            src={video.video_url}
            poster={video.cover_url || undefined}
            controls
            playsInline
          />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{video.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCount(video.visit_count)} 播放 · {formatCount(video.comment_count)} 评论 ·{" "}
            {formatDateTime(video.created_at)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm">{video.description || "暂无简介"}</p>
          {!video.cover_url ? (
            <p className="mt-2 text-xs text-amber-600">封面生成中（Kafka worker 异步抽帧）</p>
          ) : null}
        </div>
        <CommentList videoId={video.id} />
      </div>
      <aside className="space-y-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">作者</p>
          <Link className="mt-1 inline-flex text-sm font-medium text-primary" to={`/user/${video.user_id}`}>
            查看用户主页
          </Link>
        </div>
      </aside>
    </div>
  );
}
