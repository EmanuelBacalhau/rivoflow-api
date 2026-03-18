import type { AWS } from '@serverless/typescript';

import { environment } from './infra/serverless/environment';
import { iamStatements } from './infra/serverless/iam';
import { accountFunctions } from './infra/serverless/functions/account';
import { authFunctions } from './infra/serverless/functions/auth';
import { edgeFunctions } from './infra/serverless/functions/edges';
import { flowFunctions } from './infra/serverless/functions/flows';
import { nodeFunctions } from './infra/serverless/functions/nodes';
import { paymentFunctions } from './infra/serverless/functions/payments';
import { apiGatewayResources } from './infra/serverless/resources/api-gateway';
import { cloudfrontResources } from './infra/serverless/resources/cloudfront';
import { cognitoResources } from './infra/serverless/resources/cognito';
import { dynamoResources } from './infra/serverless/resources/dynamo';
import { s3Resources } from './infra/serverless/resources/s3';
import { sqsResources } from './infra/serverless/resources/sqs';

const serverlessConfiguration: AWS = {
  org: 'streams',
  service: 'rivo-flow-api',

  provider: {
    name: 'aws',
    runtime: 'nodejs24.x',
    architecture: 'arm64',
    region: 'sa-east-1',
    memorySize: 128,
    stage: "${opt:stage, 'dev'}",
    environment,
    iam: {
      role: {
        statements: iamStatements,
      },
    },
    httpApi: {
      cors: {
        allowedOrigins: [
          '${env:FRONTEND_URL}',
        ],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Accept',
        ],
        allowedMethods: [
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'OPTIONS',
        ],
        allowCredentials: true,
      },
      authorizers: {
        MyAuthorizer: {
          type: 'request',
          identitySource: [
            '$request.header.Cookie',
          ],
          functionName: 'authorizer',
          enableSimpleResponses: true,
          resultTtlInSeconds: 0,
        },
      },
    },
  },

  build: {
    esbuild: {
      configFile: './esbuild.config.mjs',
    },
  },

  functions: {
    ...nodeFunctions,
    ...authFunctions,
    ...flowFunctions,
    ...accountFunctions,
    ...edgeFunctions,
    ...paymentFunctions,
  },

  resources: {
    Resources: {
      ...dynamoResources,
      ...s3Resources,
      ...sqsResources,
      ...apiGatewayResources,
      ...cloudfrontResources,
      ...cognitoResources,
    },
  },
};

export default serverlessConfiguration;
