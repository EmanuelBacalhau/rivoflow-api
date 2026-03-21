import { IUseCase } from '@application/contracts/interfaces/i-use-case';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { AccountDrizzleRepository } from '@infra/database/drizzle/repositories/account-drizzle.repository';
import { AbacatePayGateway } from '@infra/gateways/payment/abacate-pay.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

type CreateLinkChargeUseCaseInput = {
  amount: number;
  accountId: string;
};

type CreateLinkChargeUseCaseOutput = {
  link: string;
};

@Injectable()
export class CreateLinkChargeUseCase
  implements IUseCase<CreateLinkChargeUseCaseInput, CreateLinkChargeUseCaseOutput>
{
  private readonly MIN_AMOUNT = 20;

  constructor(
    private readonly abacatePayGateway: AbacatePayGateway,
    private readonly accountRepository: AccountDrizzleRepository,
  ) {}

  async execute(params: CreateLinkChargeUseCaseInput): Promise<CreateLinkChargeUseCaseOutput> {
    if (params.amount < this.MIN_AMOUNT) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR,`Minimum amount for charge is ${this.MIN_AMOUNT}`);
    }

    const account = await this.accountRepository.findById(params.accountId);

    if (!account) {
      throw new ApplicationError(ErrorCode.VALIDATION_ERROR,'Account not found');
    }

    const { link } = await this.abacatePayGateway.generateCharge({
      amount: params.amount,
      accountId: params.accountId,
      email: account.attrs.email,
      name: `${account.attrs.firstName} ${account.attrs.lastName}`,
    });

    return {
      link,
    };
  }
}
