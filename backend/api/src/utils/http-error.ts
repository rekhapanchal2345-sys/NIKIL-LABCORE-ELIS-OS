export class HttpError extends Error {
  statusCode: number;
  code?: string;

  constructor(messageOrStatus: string | number, statusCodeOrMessage?: number | string, code?: string) {
    if (typeof messageOrStatus === "number") {
      super(typeof statusCodeOrMessage === "string" ? statusCodeOrMessage : "An error occurred");
      this.statusCode = messageOrStatus;
      this.code = code;
    } else {
      super(messageOrStatus);
      this.statusCode = typeof statusCodeOrMessage === "number" ? statusCodeOrMessage : 400;
      this.code = code;
    }
    this.name = "HttpError";
  }
}
