import { getJson, request } from "@/api/request";
import type { PagedComments } from "@/types/comment";

function toForm(data: Record<string, string | undefined>): URLSearchParams {
  const form = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== "") form.set(key, value);
  });
  return form;
}

export async function listComments(input: {
  videoId: string;
  commentId?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<PagedComments> {
  const params = new URLSearchParams({
    video_id: input.videoId,
    page_num: String(input.pageNum ?? 1),
    page_size: String(input.pageSize ?? 20),
  });
  if (input.commentId) params.set("comment_id", input.commentId);
  const data = await getJson<PagedComments>(`/comment/list?${params.toString()}`);
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

export async function publishComment(input: {
  videoId: string;
  content: string;
  commentId?: string;
}): Promise<void> {
  await request<void>("/comment/publish", {
    method: "POST",
    body: toForm({
      video_id: input.videoId,
      content: input.content,
      comment_id: input.commentId,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await request<void>("/comment/delete", {
    method: "DELETE",
    body: toForm({ comment_id: commentId }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}
