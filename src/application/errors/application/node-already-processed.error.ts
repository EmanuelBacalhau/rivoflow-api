import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class NodeAlreadyProcessedError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Node has already been processed');
    this.code = ErrorCode.NODE_ALREADY_PROCESSED;
    this.statusCode = 409;
  }
}
