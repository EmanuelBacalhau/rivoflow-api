export const cognitoResources = {
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
      AccessTokenValidity: 7,
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
    DependsOn: [
      'PreTokenGenerationTriggerLambdaFunction',
    ],
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
};
