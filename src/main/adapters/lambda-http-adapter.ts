import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { HttpError } from '@application/errors/http/http-error';
import { lambdaBodyParse } from '@main/utils/lambda-body-parse';
import { lambdaErrorResponse } from '@main/utils/lambda-error-response';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithLambdaAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { Registry } from 'src/kernel/di/registry';
import { ZodError } from 'zod';

type MyAuthorizerContext = {
  internalAccountId: string;
};
type Event =
  | APIGatewayProxyEventV2
  | APIGatewayProxyEventV2WithLambdaAuthorizer<MyAuthorizerContext>;

export function lambdaHttpAdapter(implementation: Registry.Constructor<BaseController<any>>) {
  return async (event: Event): Promise<APIGatewayProxyResultV2> => {
    try {
      const controller = Registry.resolve(implementation);

      const body = lambdaBodyParse(event.body);
      const query = event.queryStringParameters || {};
      const params = event.pathParameters || {};
      const headers = event.headers || {};

      const accountId =
        'authorizer' in event.requestContext
          ? event.requestContext.authorizer.lambda.internalAccountId
          : null;

      const result = await controller.execute({
        body,
        query,
        params,
        cookies: event.cookies,
        accountId,
        headers,
      });

      return {
        statusCode: result.statusCode,
        body: result.body ? JSON.stringify(result.body) : undefined,
        cookies: result.cookies,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return lambdaErrorResponse({
          statusCode: 400,
          code: ErrorCode.VALIDATION_ERROR,
          message: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      if (error instanceof ApplicationError || error instanceof HttpError) {
        return lambdaErrorResponse({
          statusCode: error.statusCode,
          code: error.code,
          message: error.message,
        });
      }

      console.error(
        JSON.stringify({
          level: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        }),
      );

      return lambdaErrorResponse({
        statusCode: 500,
        message: 'Internal Server Error',
        code: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    }
  };
}
