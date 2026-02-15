import { ErrorCode } from '../error-code';

export abstract class HttpError extends Error {
  public abstract code: ErrorCode;
  public abstract statusCode: number;
}
