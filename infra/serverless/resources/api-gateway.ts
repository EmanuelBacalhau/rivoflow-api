export const apiGatewayResources = {
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
};
