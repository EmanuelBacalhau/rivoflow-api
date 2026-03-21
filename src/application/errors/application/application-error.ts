import { ErrorCode } from '../error-code';

const STATUS_CODE_MAP: Record<string, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_NODE_TYPE]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.NODE_ALREADY_PROCESSING]: 409,
  [ErrorCode.NODE_ALREADY_PROCESSED]: 409,
  [ErrorCode.NO_FILE_UPLOADED]: 422,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
};

export class ApplicationError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message?: string) {
    super(message || code);
    this.code = code;
    this.statusCode = STATUS_CODE_MAP[code] ?? 500;
  }
}
