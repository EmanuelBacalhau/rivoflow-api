import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class ValidationError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Validation error');
    this.code = ErrorCode.VALIDATION_ERROR;
    this.statusCode = 400;
  }
}
