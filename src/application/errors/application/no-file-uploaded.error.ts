import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class NoFileUploadedError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'No file uploaded for this node');
    this.code = ErrorCode.NO_FILE_UPLOADED;
    this.statusCode = 422;
  }
}
