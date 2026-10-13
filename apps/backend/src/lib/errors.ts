/** An error whose message is safe to send to the client as-is. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what = "Not found") => new HttpError(404, what);
export const conflict = (message: string) => new HttpError(409, message);
