import { Link } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export default function UserMeta({
  userId,
  className,
  avatarClassName,
  showTime,
  timeText,
  compact = false,
}: {
  userId: string;
  className?: string;
  avatarClassName?: string;
  showTime?: boolean;
  timeText?: string;
  compact?: boolean;
}) {
  const query = useUser(userId);
  const username = query.data?.username;
  const avatarUrl = query.data?.avatar_url;
  const displayName = username || (query.isLoading ? "加载中..." : "匿名用户");

  return (
    <Link
      to={`/user/${userId}`}
      className={cn("inline-flex min-w-0 items-center gap-2 hover:opacity-90", className)}
    >
      <Avatar
        src={avatarUrl}
        alt={username || displayName}
        className={cn(compact ? "size-6" : "size-8", avatarClassName)}
      />
      <span className="min-w-0">
        <span className={cn("block truncate font-medium", compact ? "text-xs" : "text-sm")}>
          {displayName}
        </span>
        {showTime && timeText ? (
          <span className="block truncate text-xs text-muted-foreground">{timeText}</span>
        ) : null}
      </span>
    </Link>
  );
}
