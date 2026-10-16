import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "@/api/auth";
import { getUserVideos } from "@/api/video";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import VideoCard from "@/components/VideoCard";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { upsertConversation } from "@/lib/conversations";

export default function UserProfilePage() {
  const { id = "" } = useParams();
  const { user: me } = useCurrentUser();

  const userQuery = useQuery({
    queryKey: ["user", id],
    enabled: Boolean(id),
    queryFn: () => getUserInfo(id),
  });
  const videosQuery = useQuery({
    queryKey: ["user-videos", id],
    enabled: Boolean(id),
    queryFn: () => getUserVideos(id, 1, 24),
  });

  if (userQuery.isLoading) return <PageLoading />;
  if (userQuery.isError || !userQuery.data) return <EmptyState title="用户不存在" />;

  const user = userQuery.data;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <Avatar src={user.avatar_url} alt={user.username} className="size-16" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            <p className="text-sm text-muted-foreground">ID: {user.id}</p>
          </div>
          {me && me.id !== user.id ? (
            <Link
              to={`/messages/${user.id}`}
              onClick={() => upsertConversation({ peerId: user.id })}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
            >
              发私信
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {videosQuery.isLoading ? (
        <PageLoading />
      ) : (videosQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState title="该用户暂无投稿" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videosQuery.data!.items.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
