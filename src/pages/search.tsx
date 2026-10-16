import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchVideos } from "@/api/video";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  const [keywords, setKeywords] = useState("");
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState({ keywords: "", username: "" });

  const query = useQuery({
    queryKey: ["search", submitted],
    queryFn: () =>
      searchVideos({
        keywords: submitted.keywords || undefined,
        username: submitted.username || undefined,
        page_num: 1,
        page_size: 24,
      }),
    enabled: Boolean(submitted.keywords || submitted.username),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">搜索</h1>
        <p className="text-sm text-muted-foreground">按关键词或用户名找视频</p>
      </div>
      <form
        className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted({ keywords: keywords.trim(), username: username.trim() });
        }}
      >
        <Input placeholder="关键词" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        <Input placeholder="用户名" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Button type="submit">搜索</Button>
      </form>
      {!submitted.keywords && !submitted.username ? (
        <EmptyState title="输入条件开始搜索" />
      ) : query.isLoading ? (
        <PageLoading />
      ) : query.isError ? (
        <EmptyState title="搜索失败" />
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="没有匹配结果" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data!.items.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
