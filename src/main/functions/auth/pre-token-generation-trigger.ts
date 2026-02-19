import 'reflect-metadata';

import { AccountDynamoRepository } from '@infra/database/dynamo/repositories/account-dynamo.repository';
import { Registry } from '@kernel/di/registry';
import { PreTokenGenerationV2TriggerEvent } from 'aws-lambda';

const accountRepository = Registry.resolve(AccountDynamoRepository);

export const handler = async (event: PreTokenGenerationV2TriggerEvent) => {
  const { email } = event.request.userAttributes;
  const account = await accountRepository.findByEmail({
    email,
  });

  if (!account) {
    console.warn(`Account not found for email ${email} during pre-token generation`);
    return event;
  }

  event.response = {
    claimsAndScopeOverrideDetails: {
      accessTokenGeneration: {
        claimsToAddOrOverride: {
          internalAccountId: account.attrs.id,
        },
      },
    },
  };

  return event;
};
