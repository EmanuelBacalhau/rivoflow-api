import { ErrorCode } from '@application/errors/error-code';

interface LambdaErrorParams {
  statusCode: number;
  message:
    | string
    | Array<{
        path: string;
        message: string;
      }>;
  code: ErrorCode;
}

export function lambdaErrorResponse({ statusCode, message, code }: LambdaErrorParams) {
  return {
    statusCode,
    body: JSON.stringify({
      error: {
        code,
        message,
      },
    }),
  };
}
