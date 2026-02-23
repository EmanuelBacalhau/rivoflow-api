import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class UnauthorizedError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Unauthorized');
    this.code = ErrorCode.UNAUTHORIZED;
    this.statusCode = 401;
  }
}
