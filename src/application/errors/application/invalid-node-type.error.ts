import { ErrorCode } from '../error-code';
import { ApplicationError } from './application-error';

export class InvalidNodeTypeError extends ApplicationError {
  public override code: ErrorCode;
  public override statusCode: number;
  constructor(message?: string) {
    super(message || 'Invalid node type for this operation');
    this.code = ErrorCode.INVALID_NODE_TYPE;
    this.statusCode = 400;
  }
}
