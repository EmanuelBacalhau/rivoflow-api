import 'reflect-metadata';
import { CreateAccountBalanceUseCase } from '@application/use-cases/account/create-account-balance.use-case';
import { CreateAccountUseCase } from '@application/use-cases/auth/create-account.use-case';
import { Registry } from '@kernel/di/registry';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const createAccountUseCase = Registry.resolve(CreateAccountUseCase);
const createAccountBalanceUseCase = Registry.resolve(CreateAccountBalanceUseCase);
export const handler = async (event: PostConfirmationTriggerEvent) => {
  const isGoogle = event.userName.startsWith('Google_');
  const provider = isGoogle ? 'Google' : 'Cognito';
  const { email, given_name, family_name, picture, sub: externalId } = event.request.userAttributes;

  try {
    const account = await createAccountUseCase.execute({
      email,
      givenName: given_name,
      familyName: family_name,
      picture,
      provider,
      externalId,
    });

    await createAccountBalanceUseCase.execute({
      accountId: account.attrs.id,
      balance: 0,
      lifetimeDeposited: 0,
      lifetimeSpent: 0,
    });
  } catch (error) {
    console.error(`Failed to execute CreateAccountUseCase for ${email}:`, error);
  }

  return event;
};
