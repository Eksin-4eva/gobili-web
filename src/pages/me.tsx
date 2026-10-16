import { useRef, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/AuthGuard";
import EmptyState from "@/components/EmptyState";
import PageLoading from "@/components/PageLoading";
import VideoCard from "@/components/VideoCard";
import { bindMfa, getMfaQrcode, uploadAvatar } from "@/api/auth";
import { getUserVideos } from "@/api/video";
import { ApiError } from "@/api/apiError";
import { $tip } from "@/components/tip";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function MeContent() {
  const { user, setUser, refresh } = useCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQrcode, setMfaQrcode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [busy, setBusy] = useState(false);

  const videosQuery = useQuery({
    queryKey: ["my-videos", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => getUserVideos(user!.id, 1, 24),
  });

  if (!user) return <PageLoading />;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <Avatar src={user.avatar_url} alt={user.username} className="size-16" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            <p className="text-sm text-muted-foreground">ID: {user.id}</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const next = await uploadAvatar(file);
                  setUser(next);
                  $tip("头像已更新", "success");
                } catch (error) {
                  $tip(error instanceof ApiError ? error.message : "上传失败", "error");
                }
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              更换头像
            </Button>
            <Link
              to={`/user/${user.id}`}
              className="inline-flex h-9 items-center rounded-lg bg-secondary px-3 text-sm text-secondary-foreground"
            >
              主页
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MFA 二次验证</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const data = await getMfaQrcode();
                setMfaSecret(data.secret);
                setMfaQrcode(data.qrcode);
              } catch (error) {
                $tip(error instanceof ApiError ? error.message : "获取失败", "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            获取绑定二维码
          </Button>
          {mfaQrcode ? (
            <div className="space-y-3">
              <img src={mfaQrcode} alt="MFA QRCode" className="mx-auto max-w-56 rounded-lg border" />
              <p className="break-all text-xs text-muted-foreground">secret: {mfaSecret}</p>
              <Input
                placeholder="输入验证器中的 6 位验证码"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
              />
              <Button
                onClick={async () => {
                  try {
                    await bindMfa(mfaSecret, mfaCode);
                    $tip("MFA 绑定成功", "success");
                    await refresh();
                  } catch (error) {
                    $tip(error instanceof ApiError ? error.message : "绑定失败", "error");
                  }
                }}
              >
                确认绑定
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">我的投稿</h2>
          <Button variant="outline" size="sm" onClick={() => void videosQuery.refetch()}>
            刷新
          </Button>
        </div>
        {videosQuery.isLoading ? (
          <PageLoading />
        ) : (videosQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState title="还没有投稿" description="去发布第一条视频吧" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videosQuery.data!.items.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MePage() {
  return (
    <AuthGuard>
      <MeContent />
    </AuthGuard>
  );
}
