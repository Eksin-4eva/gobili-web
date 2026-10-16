export interface ApiResult<T = unknown> {
  code: string;
  message: string;
  data?: T;
}
