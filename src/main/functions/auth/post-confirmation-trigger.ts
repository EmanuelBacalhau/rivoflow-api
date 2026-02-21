import 'reflect-metadata';
import { CreateAccountUseCase } from '@application/use-cases/account/create-account.use-case';
import { Registry } from '@kernel/di/registry';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const createAccountUseCase = Registry.resolve(CreateAccountUseCase);
export const handler = async (event: PostConfirmationTriggerEvent) => {
  const isGoogle = event.userName.startsWith('Google_');
  const provider = isGoogle ? 'Google' : 'Cognito';
  const { email, given_name, family_name, picture, sub: externalId } = event.request.userAttributes;

  try {
    await createAccountUseCase.execute({
      email,
      givenName: given_name,
      familyName: family_name,
      picture,
      provider,
      externalId,
    });
  } catch (error) {
    console.error(`Failed to execute CreateAccountUseCase for ${email}:`, error);
  }

  return event;
};
