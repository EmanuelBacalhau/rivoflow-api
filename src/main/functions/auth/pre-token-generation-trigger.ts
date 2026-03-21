import 'reflect-metadata';

import { AccountDrizzleRepository } from '@infra/database/drizzle/repositories/account-drizzle.repository';
import { Registry } from '@kernel/di/registry';
import { PreTokenGenerationV2TriggerEvent } from 'aws-lambda';

const accountRepository = Registry.resolve(AccountDrizzleRepository);

export const handler = async (event: PreTokenGenerationV2TriggerEvent) => {
  const { email } = event.request.userAttributes;
  const account = await accountRepository.findByEmail(email);

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
