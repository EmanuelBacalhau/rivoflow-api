import type { AWS } from '@serverless/typescript';

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
    environment: {
      DYNAMO_TABLE: {
        Ref: 'MainTable',
      },
      RIVO_FLOW_BUCKET: {
        Ref: 'MainBucket',
      },
      IMAGE_QUEUE_URL: {
        Ref: 'ImageQueue',
      },
      GOOGLE_GENAI_API_KEY: '${env:GOOGLE_GENAI_API_KEY}',
      COGNITO_CLIENT_ID: {
        Ref: 'UserPoolClient',
      },
      COGNITO_CLIENT_SECRET: {
        'Fn::GetAtt': [
          'UserPoolClient',
          'ClientSecret',
        ],
      },
      COGNITO_POOL_DOMAIN: {
        'Fn::Sub': 'https://${UserPoolDomain}.auth.${AWS::Region}.amazoncognito.com',
      },
      USER_POOL_ID: {
        Ref: 'UserPool',
      },
      CDN_DOMAIN_NAME: '${env:CDN_DOMAIN_NAME}',
      REGION: '${self:provider.region}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:GetObject',
              's3:DeleteObject',
              's3:DeleteObjects',
            ],
            Resource: {
              'Fn::Sub': '${MainBucket.Arn}/*',
            },
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:BatchWriteItem',
              'dynamodb:BatchGetItem',
              'dynamodb:TransactWriteItems',
            ],
            Resource: [
              {
                'Fn::GetAtt': [
                  'MainTable',
                  'Arn',
                ],
              },
              {
                'Fn::Sub': '${MainTable.Arn}/index/*',
              },
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:SendMessage',
            ],
            Resource: {
              'Fn::GetAtt': [
                'ImageQueue',
                'Arn',
              ],
            },
          },
        ],
      },
    },
    httpApi: {
      cors: {
        allowedOrigins: [
          'http://localhost:3000',
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
    // Node
    createNode: {
      handler: 'src/main/functions/nodes/create-node.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/flows/{flowId}/nodes',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    updateNode: {
      handler: 'src/main/functions/nodes/update-node.handler',
      events: [
        {
          httpApi: {
            method: 'PUT',
            path: '/flows/{flowId}/nodes/{nodeId}',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    uploadFile: {
      handler: 'src/main/functions/nodes/upload-file.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/flows/{flowId}/nodes/{nodeId}/upload',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    confirmUpload: {
      handler: 'src/main/functions/nodes/confirm-upload.handler',
      events: [
        {
          httpApi: {
            method: 'PATCH',
            path: '/flows/{flowId}/nodes/{nodeId}/confirm-upload',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    deleteNode: {
      handler: 'src/main/functions/nodes/delete-node.handler',
      events: [
        {
          httpApi: {
            method: 'DELETE',
            path: '/flows/{flowId}/nodes/{nodeId}',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    createImageAI: {
      handler: 'src/main/functions/nodes/create-image-ai.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/flows/{flowId}/nodes/{nodeId}/generate-image',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    processImageAI: {
      handler: 'src/main/functions/nodes/process-image-ai.handler',
      memorySize: 1024,
      timeout: 300,
      events: [
        {
          sqs: {
            arn: {
              'Fn::GetAtt': [
                'ImageQueue',
                'Arn',
              ],
            },
            batchSize: 2,
          },
        },
      ],
    },
    calculateCreditsNodeGenerator: {
      handler: 'src/main/functions/nodes/calculate-credits-node-generator.handler',
      events: [
        {
          httpApi: {
            method: 'GET',
            path: '/flows/{flowId}/nodes/{nodeId}/calculate-credits',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },

    // Auth
    exchangeCode: {
      handler: 'src/main/functions/auth/exchange-code.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/auth/exchange-code',
          },
        },
      ],
    },
    preTokenGenerationTrigger: {
      handler: 'src/main/functions/auth/pre-token-generation-trigger.handler',
    },
    postConfirmationTrigger: {
      handler: 'src/main/functions/auth/post-confirmation-trigger.handler',
      dependsOn: [
        'UserPool',
      ],
      events: [
        {
          cognitoUserPool: {
            pool: '${self:service}-${self:provider.stage}-userpool',
            trigger: 'PostConfirmation',
            existing: true,
            forceDeploy: true,
          },
        },
      ],
    },
    refreshToken: {
      handler: 'src/main/functions/auth/refresh-token.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/auth/refresh-token',
          },
        },
      ],
    },
    authorizer: {
      handler: 'src/main/functions/auth/authorizer.handler',
    },
    signOut: {
      handler: 'src/main/functions/auth/sign-out.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/auth/sign-out',
          },
        },
      ],
    },

    // Flow
    listFlowsByAccount: {
      handler: 'src/main/functions/flows/list-flows-by-account.handler',
      events: [
        {
          httpApi: {
            method: 'GET',
            path: '/flows',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    createFlow: {
      handler: 'src/main/functions/flows/create-flow.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/flows',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    getFlowById: {
      handler: 'src/main/functions/flows/get-flow-by-id.handler',
      events: [
        {
          httpApi: {
            method: 'GET',
            path: '/flows/{flowId}',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    deleteFlow: {
      handler: 'src/main/functions/flows/delete-flow.handler',
      events: [
        {
          httpApi: {
            method: 'DELETE',
            path: '/flows/{flowId}',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },

    // Account
    getMe: {
      handler: 'src/main/functions/account/get-me.handler',
      events: [
        {
          httpApi: {
            method: 'GET',
            path: '/account/me',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },

    // Edges
    createEdge: {
      handler: 'src/main/functions/edges/create-edge.handler',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/edges',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
    deleteEdge: {
      handler: 'src/main/functions/edges/delete-edge.handler',
      events: [
        {
          httpApi: {
            method: 'DELETE',
            path: '/edges/{edgeId}',
            authorizer: 'MyAuthorizer',
          },
        },
      ],
    },
  },

  resources: {
    Resources: {
      MainTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:service}-${self:provider.stage}-table',
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
            RecoveryPeriodInDays: 35,
          },
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'PK',
              AttributeType: 'S',
            },
            {
              AttributeName: 'SK',
              AttributeType: 'S',
            },
            {
              AttributeName: 'GSI1PK1',
              AttributeType: 'S',
            },
            {
              AttributeName: 'GSI1SK1',
              AttributeType: 'S',
            },
            {
              AttributeName: 'GSI1SK2',
              AttributeType: 'S',
            },
            {
              AttributeName: 'GSI1SK3',
              AttributeType: 'S',
            },
            {
              AttributeName: 'GSI1SK4',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'PK',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'SK',
              KeyType: 'RANGE',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'GSI1',
              KeySchema: [
                {
                  AttributeName: 'GSI1PK1',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'GSI1SK1',
                  KeyType: 'RANGE',
                },
                {
                  AttributeName: 'GSI1SK2',
                  KeyType: 'RANGE',
                },
                {
                  AttributeName: 'GSI1SK3',
                  KeyType: 'RANGE',
                },
                {
                  AttributeName: 'GSI1SK4',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
            },
          ],
        },
      },

      MainBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:service}-${self:provider.stage}-${self:provider.region}-bucket',
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                ],
                AllowedOrigins: [
                  'http://localhost:3000',
                ],
                AllowedHeaders: [
                  '*',
                ],
              },
            ],
          },
        },
      },

      ImageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-${self:provider.stage}-image-queue',
          VisibilityTimeout: 360,
          ReceiveMessageWaitTimeSeconds: 20,
          RedrivePolicy: {
            maxReceiveCount: 3,
            deadLetterTargetArn: {
              'Fn::GetAtt': [
                'DLQImageQueue',
                'Arn',
              ],
            },
          },
        },
      },

      DLQImageQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:service}-${self:provider.stage}-image-dlq',
          MessageRetentionPeriod: 1209600,
        },
      },

      APIGWCustomDomainCertificate: {
        Type: 'AWS::CertificateManager::Certificate',
        Properties: {
          DomainName: '${env:API_DOMAIN_NAME}',
          ValidationMethod: 'DNS',
          DomainValidationOptions: [
            {
              DomainName: '${env:API_DOMAIN_NAME}',
              HostedZoneId: '${env:ROUTE53_HOSTED_ZONE_ID}',
            },
          ],
        },
      },

      APIGWCustomDomain: {
        Type: 'AWS::ApiGatewayV2::DomainName',
        Properties: {
          DomainName: '${env:API_DOMAIN_NAME}',
          RoutingMode: 'API_MAPPING_ONLY',
          DomainNameConfigurations: [
            {
              EndpointType: 'REGIONAL',
              IpAddressType: 'IPV4',
              SecurityPolicy: 'TLS_1_2',
              CertificateArn: {
                Ref: 'APIGWCustomDomainCertificate',
              },
            },
          ],
        },
      },

      APIGWCustomDomainMapping: {
        Type: 'AWS::ApiGatewayV2::ApiMapping',
        Properties: {
          ApiId: {
            Ref: 'HttpApi',
          },
          DomainName: {
            Ref: 'APIGWCustomDomain',
          },
          Stage: '$default',
        },
      },

      APIGWCustomDomainRoute53Record: {
        Type: 'AWS::Route53::RecordSet',
        Properties: {
          HostedZoneId: '${env:ROUTE53_HOSTED_ZONE_ID}',
          Name: {
            Ref: 'APIGWCustomDomain',
          },
          Type: 'A',
          AliasTarget: {
            DNSName: {
              'Fn::GetAtt': [
                'APIGWCustomDomain',
                'RegionalDomainName',
              ],
            },
            HostedZoneId: {
              'Fn::GetAtt': [
                'APIGWCustomDomain',
                'RegionalHostedZoneId',
              ],
            },
          },
        },
      },

      MainBucketOAC: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
          OriginAccessControlConfig: {
            Name: 'MainBucketOAC',
            Description: 'OAC for MainBucket',
            SigningBehavior: 'always',
            SigningProtocol: 'sigv4',
            OriginAccessControlOriginType: 's3',
          },
        },
      },

      MainBucketCDN: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Aliases: [
              '${env:CDN_DOMAIN_NAME}',
            ],
            Enabled: true,
            Origins: [
              {
                Id: 'S3Origin',
                S3OriginConfig: {},
                DomainName: {
                  'Fn::GetAtt': [
                    'MainBucket',
                    'RegionalDomainName',
                  ],
                },
                OriginAccessControlId: {
                  'Fn::GetAtt': [
                    'MainBucketOAC',
                    'Id',
                  ],
                },
              },
            ],
            DefaultCacheBehavior: {
              Compress: true,
              TargetOriginId: 'S3Origin',
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: [
                'GET',
                'HEAD',
              ],
              CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
            },
            HttpVersion: 'http2and3',
            ViewerCertificate: {
              AcmCertificateArn: '${env:CDN_CERTIFICATE_ARN}',
              SslSupportMethod: 'sni-only',
              MinimumProtocolVersion: 'TLSv1.3_2025',
            },
          },
        },
      },

      MainBucketCDNPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: {
            Ref: 'MainBucket',
          },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Sid: 'AllowCloudFrontServicePrincipal',
                Principal: {
                  Service: 'cloudfront.amazonaws.com',
                },
                Action: 's3:GetObject',
                Resource: {
                  'Fn::Sub': '${MainBucket.Arn}/*',
                },
                Condition: {
                  StringEquals: {
                    'AWS:SourceArn': {
                      'Fn::Sub':
                        'arn:aws:cloudfront::${AWS::AccountId}:distribution/${MainBucketCDN}',
                    },
                  },
                },
              },
            ],
          },
        },
      },

      MainBucketCDNCustomDomainRoute53Record: {
        Type: 'AWS::Route53::RecordSet',
        Properties: {
          HostedZoneId: '${env:ROUTE53_HOSTED_ZONE_ID}',
          Name: '${env:CDN_DOMAIN_NAME}',
          Type: 'A',
          AliasTarget: {
            DNSName: {
              'Fn::GetAtt': [
                'MainBucketCDN',
                'DomainName',
              ],
            },
            HostedZoneId: 'Z2FDTNDATAQYW2',
          },
        },
      },

      UserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: '${self:service}-${self:provider.stage}-userpool',
          MfaConfiguration: 'OFF',
          AdminCreateUserConfig: {
            AllowAdminCreateUserOnly: true,
          },
          UsernameAttributes: [
            'email',
          ],
          Schema: [
            {
              Name: 'given_name',
              AttributeDataType: 'String',
              Required: true,
            },
            {
              Name: 'family_name',
              AttributeDataType: 'String',
              Required: true,
            },
          ],
          LambdaConfig: {
            PreTokenGenerationConfig: {
              LambdaVersion: 'V2_0',
              LambdaArn: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-preTokenGenerationTrigger',
              },
            },
          },
        },
      },

      UserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        DependsOn: [
          'UserPool',
          'GoogleIdentityProvider',
        ],
        Properties: {
          ClientName: '${self:service}-${self:provider.stage}-userpool-client',
          UserPoolId: {
            Ref: 'UserPool',
          },
          GenerateSecret: true,
          AllowedOAuthFlowsUserPoolClient: true,
          AllowedOAuthFlows: [
            'code',
          ],
          AllowedOAuthScopes: [
            'email',
            'openid',
            'profile',
          ],
          CallbackURLs: [
            '${env:COGNITO_CALLBACK_URL}',
          ],
          SupportedIdentityProviders: [
            'Google',
          ],
          TokenValidityUnits: {
            AccessToken: 'hours',
          },
          AccessTokenValidity: 1,
          RefreshTokenRotation: {
            Feature: 'ENABLED',
            RetryGraceperiodSeconds: 0,
          },
        },
      },

      UserPoolDomain: {
        Type: 'AWS::Cognito::UserPoolDomain',
        DependsOn: [
          'UserPool',
        ],
        Properties: {
          Domain: 'rivoflow-${self:provider.stage}',
          UserPoolId: {
            Ref: 'UserPool',
          },
        },
      },

      GoogleIdentityProvider: {
        Type: 'AWS::Cognito::UserPoolIdentityProvider',
        DependsOn: [
          'UserPool',
        ],
        Properties: {
          ProviderName: 'Google',
          UserPoolId: {
            Ref: 'UserPool',
          },
          ProviderType: 'Google',
          ProviderDetails: {
            authorize_scopes: 'email openid profile',
            client_id: '${env:GOOGLE_CLIENT_ID}',
            client_secret: '${env:GOOGLE_CLIENT_SECRET}',
          },
          AttributeMapping: {
            email: 'email',
            given_name: 'given_name',
            family_name: 'family_name',
            email_verified: 'email_verified',
            picture: 'picture',
          },
        },
      },

      PreTokenGenerationInvokePermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: {
            'Fn::Sub':
              'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-preTokenGenerationTrigger',
          },
          Action: 'lambda:InvokeFunction',
          Principal: 'cognito-idp.amazonaws.com',
          SourceArn: {
            'Fn::GetAtt': [
              'UserPool',
              'Arn',
            ],
          },
        },
      },
    },
  },
};

export default serverlessConfiguration;
