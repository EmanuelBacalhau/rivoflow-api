import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

export function lambdaBodyParse(body: APIGatewayProxyEventV2['body']) {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new ApplicationError(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body');
  }
}
