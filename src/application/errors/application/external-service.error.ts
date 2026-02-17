import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class ExternalServiceError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'External service error');
    this.code = ErrorCode.EXTERNAL_SERVICE_ERROR;
    this.statusCode = 502;
  }
}
