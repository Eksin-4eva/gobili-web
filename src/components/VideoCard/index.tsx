import { Link } from "react-router";
import { MessageSquare, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCount } from "@/lib/format";
import type { Video } from "@/types/video";

export default function VideoCard({ video }: { video: Video }) {
  const coverReady = Boolean(video.cover_url);

  return (
    <Link
      to={`/video/${video.id}`}
      state={{ video }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {coverReady ? (
          <img
            src={video.cover_url}
            alt={video.title}
            className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <Play className="size-5 opacity-60" />
            封面生成中
          </div>
        )}
        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
          {formatCount(video.visit_count)} 播放
        </Badge>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{video.description || "暂无简介"}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="size-3.5" />
          {formatCount(video.comment_count)}
        </div>
      </div>
    </Link>
  );
}
