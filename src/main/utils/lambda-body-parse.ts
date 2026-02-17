import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

class InvalidJsonBodyError extends ApplicationError {
  public readonly code = ErrorCode.VALIDATION_ERROR;
  public readonly statusCode = 400;
  constructor() {
    super('Invalid JSON body');
  }
}

export function lambdaBodyParse(body: APIGatewayProxyEventV2['body']) {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new InvalidJsonBodyError();
  }
}
