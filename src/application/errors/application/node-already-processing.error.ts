import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class NodeAlreadyProcessingError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Node is already being processed');
    this.code = ErrorCode.NODE_ALREADY_PROCESSING;
    this.statusCode = 409;
  }
}
