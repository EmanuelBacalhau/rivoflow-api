import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class ForbiddenError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Forbidden');
    this.code = ErrorCode.FORBIDDEN;
    this.statusCode = 403;
  }
}
