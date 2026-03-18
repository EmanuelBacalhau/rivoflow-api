export const cloudfrontResources = {
  MainBucketOAC: {
    Type: 'AWS::CloudFront::OriginAccessControl',
    Properties: {
      OriginAccessControlConfig: {
        Name: 'MainBucketOAC-${self:provider.stage}',
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
            'OPTIONS',
          ],
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
          ResponseHeadersPolicyId: '5cc3b908-e619-4b99-88e5-2cf7f45965bd',
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
};
