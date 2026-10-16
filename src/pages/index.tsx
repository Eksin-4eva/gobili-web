import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/api/video";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";

export default function FeedPage() {
  const query = useQuery({
    queryKey: ["feed"],
    queryFn: () => getFeed(),
  });

  if (query.isLoading) return <PageLoading label="加载推荐中..." />;
  if (query.isError) {
    return <EmptyState title="加载失败" description="请确认 gobili 后端已启动（8888）" />;
  }

  const items = query.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">推荐</h1>
          <p className="text-sm text-muted-foreground">最新投稿视频流</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          刷新
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="还没有视频" description="登录后去投稿第一条吧" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
