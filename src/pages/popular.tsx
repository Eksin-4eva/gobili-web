import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPopular } from "@/api/video";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";

export default function PopularPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["popular", page],
    queryFn: () => getPopular(page, 12),
  });

  if (query.isLoading) return <PageLoading label="加载热门榜..." />;
  if (query.isError) return <EmptyState title="热门榜加载失败" />;

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">热门</h1>
        <p className="text-sm text-muted-foreground">按播放量排序 · 共 {total} 条</p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="暂无热门视频" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          上一页
        </Button>
        <Button variant="outline" size="sm" disabled={items.length === 0} onClick={() => setPage((p) => p + 1)}>
          下一页
        </Button>
      </div>
    </div>
  );
}
