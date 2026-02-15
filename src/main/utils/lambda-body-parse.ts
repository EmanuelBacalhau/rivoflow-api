import { APIGatewayProxyEventV2 } from 'aws-lambda';

export function lambdaBodyParse(body: APIGatewayProxyEventV2['body']) {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error('Invalid JSON body');
  }
}
