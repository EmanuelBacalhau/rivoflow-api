import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class ResourceNotFoundError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Resource not found');
    this.code = ErrorCode.RESOURCE_NOT_FOUND;
    this.statusCode = 404;
  }
}
