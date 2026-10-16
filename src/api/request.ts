import { ApiError, NetworkError } from "@/api/apiError";
import {
  AUTH_ERROR_CODE,
  AUTH_HEADER,
  ACCESS_TOKEN_RESPONSE_HEADER,
  REFRESH_TOKEN_HEADER,
  REFRESH_TOKEN_RESPONSE_HEADER,
  SUCCESS_CODE,
} from "@/lib/constants";
import {
  AuthExpiredError,
  redirectExpiredSession,
} from "@/lib/authError";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/session";
import type { ApiResult } from "@/types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

function headerValue(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

/** 捕获 gobili 下发的 Access-Token / Refresh-Token（登录与每次鉴权换发） */
export function captureTokensFromHeaders(headers: Headers): void {
  const access = headerValue(headers, ACCESS_TOKEN_RESPONSE_HEADER);
  const refresh = headerValue(headers, REFRESH_TOKEN_RESPONSE_HEADER);
  if (access) {
    setTokens(access, refresh);
  } else if (refresh) {
    const current = getAccessToken();
    if (current) setTokens(current, refresh);
  }
}

function isApiResult<T>(value: unknown): value is ApiResult<T> {
  return typeof value === "object" && value !== null && "code" in value && "message" in value;
}

export type RequestOptions = RequestInit & {
  /** 跳过自动附带鉴权头（注册等） */
  skipAuth?: boolean;
  /** 原始 FormData / 文件上传时不要强行写 JSON Content-Type */
  isFormData?: boolean;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, isFormData = false, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (!isFormData && !headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }

  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (!skipAuth) {
    if (access) headers.set(AUTH_HEADER, access);
    if (refresh) headers.set(REFRESH_TOKEN_HEADER, refresh);
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      ...rest,
      headers,
    });
  } catch {
    throw new NetworkError();
  }

  captureTokensFromHeaders(response.headers);

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new ApiError(`请求失败 (${response.status})`);
    }
    return undefined as T;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("响应解析失败");
  }

  if (!isApiResult<T>(parsed)) {
    if (!response.ok) {
      throw new ApiError(`请求失败 (${response.status})`);
    }
    return parsed as T;
  }

  if (parsed.code === SUCCESS_CODE) {
    return parsed.data as T;
  }

  if (parsed.code === AUTH_ERROR_CODE) {
    const usedAccess = access;
    const usedRefresh = refresh;
    // 仅当本地会话仍是这次请求使用的会话时才清理，避免并发误伤
    if (
      getAccessToken() === usedAccess &&
      getRefreshToken() === usedRefresh
    ) {
      clearSession();
      redirectExpiredSession();
    }
    throw new AuthExpiredError(parsed.message || undefined);
  }

  throw new ApiError(parsed.message || "请求失败", parsed.code);
}

export async function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export async function postJson<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function postForm<T>(
  path: string,
  form: FormData | URLSearchParams,
  options?: RequestOptions,
): Promise<T> {
  const isFormData = form instanceof FormData;
  return request<T>(path, {
    ...options,
    method: "POST",
    body: form,
    isFormData,
    headers: isFormData ? options?.headers : {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
}

export async function putFormData<T>(
  path: string,
  form: FormData,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: form,
    isFormData: true,
  });
}

export async function deleteJson<T>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "DELETE",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
