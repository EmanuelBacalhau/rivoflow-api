import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { AccountBalanceEntity } from '@application/entities/account-balance.entity';
import { AccountDynamoRepository } from '@infra/database/dynamo/repositories/account-dynamo.repository';
import { Injectable } from 'src/kernel/decorators/injectable';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';

interface GetMeUseCaseInput {
  accountId: string;
}

interface GetMeUseCaseOutput {
  account: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    picture: string;
    isActive: boolean;
  };
  balance: {
    credits: number;
    lifetimeDeposited: number;
    lifetimeSpent: number;
  };
}

@Injectable()
export class GetMeUseCase implements IUseCase<GetMeUseCaseInput, GetMeUseCaseOutput> {
  constructor(private readonly accountRepository: AccountDynamoRepository) {}

  async execute(params: GetMeUseCaseInput): Promise<GetMeUseCaseOutput> {
    const entity = await this.accountRepository.findByIdWithBalance(params.accountId);

    if (!entity) {
      throw new ApplicationError(ErrorCode.UNAUTHORIZED,'Account not found');
    }

    const { attrs } = entity;
    const balance: AccountBalanceEntity.Attributes = entity.attrs.balance.attrs;

    return {
      account: {
        id: attrs.id,
        email: attrs.email,
        firstName: attrs.firstName,
        lastName: attrs.lastName,
        picture: attrs.picture,
        isActive: attrs.isActive,
      },
      balance: {
        credits: balance.balance,
        lifetimeDeposited: balance.lifetimeDeposited,
        lifetimeSpent: balance.lifetimeSpent,
      },
    };
  }
}
