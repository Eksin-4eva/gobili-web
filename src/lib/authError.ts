export const AUTH_EXPIRED_MESSAGE = "登录状态无效，请重新登录";
export const AUTH_EXPIRED_EVENT = "gobili:auth-expired";

export class AuthExpiredError extends Error {
  constructor(message = AUTH_EXPIRED_MESSAGE) {
    super(message);
    this.name = "AuthExpiredError";
  }
}

export function redirectExpiredSession(loginPath = "/login"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  const current = `${window.location.pathname}${window.location.search}`;
  const target =
    current.startsWith("/login") || current.startsWith("/register")
      ? loginPath
      : `${loginPath}?redirect=${encodeURIComponent(current)}`;
  if (window.location.pathname !== "/login") {
    window.location.assign(target);
  }
}
