export class ApiError extends Error {
  code: string;

  constructor(message: string, code = "error") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export class NetworkError extends ApiError {
  constructor(message = "网络异常，请稍后重试") {
    super(message, "network");
    this.name = "NetworkError";
  }
}
