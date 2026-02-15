import { ErrorCode } from '../error-code';

export abstract class ApplicationError extends Error {
  public abstract code: ErrorCode;
  public abstract statusCode: number;
}
