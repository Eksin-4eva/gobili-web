import { useQuery } from "@tanstack/react-query";
import { getUserInfo } from "@/api/auth";
import { isLoggedIn } from "@/lib/session";
import type { User } from "@/types/user";

/**
 * 按 user_id 拉取用户资料。
 * 后端 /user/info 需要登录；未登录时不发请求，由 UI 做降级展示。
 * React Query 以 userId 为 key 做缓存，同一评论区重复作者只会请求一次。
 */
export function useUser(userId: string | undefined) {
  return useQuery<User>({
    queryKey: ["user", userId],
    enabled: Boolean(userId) && isLoggedIn(),
    staleTime: 5 * 60 * 1000,
    queryFn: () => getUserInfo(userId),
  });
}
