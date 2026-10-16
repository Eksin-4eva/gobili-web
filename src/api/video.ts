import { getJson, postForm, request } from "@/api/request";
import type { PagedVideos, SearchVideosPayload, Video } from "@/types/video";

function toForm(data: Record<string, string | number | undefined>): URLSearchParams {
  const form = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    form.set(key, String(value));
  });
  return form;
}

export async function getFeed(latestTime?: string): Promise<Video[]> {
  const query = latestTime ? `?latest_time=${encodeURIComponent(latestTime)}` : "";
  const data = await getJson<{ items?: Video[] } | Video[]>(`/video/feed${query}`);
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export async function getPopular(pageNum = 1, pageSize = 12): Promise<PagedVideos> {
  const data = await getJson<PagedVideos>(
    `/video/popular?page_num=${pageNum}&page_size=${pageSize}`,
  );
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

export async function getUserVideos(
  userId: string,
  pageNum = 1,
  pageSize = 12,
): Promise<PagedVideos> {
  const data = await getJson<PagedVideos>(
    `/video/list?user_id=${encodeURIComponent(userId)}&page_num=${pageNum}&page_size=${pageSize}`,
  );
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

export async function searchVideos(payload: SearchVideosPayload): Promise<PagedVideos> {
  const data = await postForm<PagedVideos>(
    "/video/search",
    toForm({
      keywords: payload.keywords,
      username: payload.username,
      from_date: payload.from_date,
      to_date: payload.to_date,
      page_num: payload.page_num ?? 1,
      page_size: payload.page_size ?? 12,
    }),
  );
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
  };
}

export async function visitVideo(videoId: string): Promise<void> {
  await postForm<void>("/video/visit", toForm({ video_id: videoId }));
}

export async function publishVideo(input: {
  file: File;
  title: string;
  description: string;
  cover?: File | null;
}): Promise<void> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("title", input.title);
  form.append("description", input.description);
  if (input.cover) form.append("cover", input.cover);

  await request<void>("/video/publish", {
    method: "POST",
    body: form,
    isFormData: true,
  });
}
