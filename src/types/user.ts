export interface User {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  code?: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface MfaQrcode {
  secret: string;
  qrcode: string;
}
