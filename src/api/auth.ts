import { ApiError } from "@/api/apiError";
import {
  buildApiUrl,
  captureTokensFromHeaders,
  getJson,
  request,
} from "@/api/request";
import {
  ACCESS_TOKEN_RESPONSE_HEADER,
  REFRESH_TOKEN_RESPONSE_HEADER,
  SUCCESS_CODE,
} from "@/lib/constants";
import { saveSession } from "@/lib/session";
import type { ApiResult } from "@/types/api";
import type { LoginPayload, MfaQrcode, RegisterPayload, User } from "@/types/user";

function toForm(data: Record<string, string | undefined>): URLSearchParams {
  const form = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== "") form.set(key, value);
  });
  return form;
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await request<void>("/user/register", {
    method: "POST",
    skipAuth: true,
    body: toForm({
      username: payload.username,
      password: payload.password,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export async function loginUser(payload: LoginPayload): Promise<User> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl("/user/login"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toForm({
        username: payload.username,
        password: payload.password,
        code: payload.code,
      }),
    });
  } catch {
    throw new ApiError("网络异常，请稍后重试", "network");
  }

  captureTokensFromHeaders(response.headers);
  const access = response.headers.get(ACCESS_TOKEN_RESPONSE_HEADER);
  const refresh = response.headers.get(REFRESH_TOKEN_RESPONSE_HEADER);
  const result = (await response.json()) as ApiResult<User>;

  if (result.code !== SUCCESS_CODE || !result.data) {
    throw new ApiError(result.message || "登录失败", result.code);
  }
  if (!access || !refresh) {
    throw new ApiError("登录成功但未下发令牌");
  }

  saveSession({
    accessToken: access,
    refreshToken: refresh,
    user: result.data,
  });
  return result.data;
}

export async function getUserInfo(userId?: string): Promise<User> {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  return getJson<User>(`/user/info${query}`);
}

export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("file", file);
  return request<User>("/user/avatar/upload", {
    method: "PUT",
    body: form,
    isFormData: true,
  });
}

export async function getMfaQrcode(): Promise<MfaQrcode> {
  return getJson<MfaQrcode>("/auth/mfa/qrcode");
}

export async function bindMfa(secret: string, code: string): Promise<void> {
  await request<void>("/auth/mfa/bind", {
    method: "POST",
    body: toForm({ secret, code }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}
