import { BaseController } from '@application/contracts/abstracts/base-controller';
import { CreateLinkChargeUseCase } from '@application/use-cases/payments/create-link-charge.use-case';
import { Schema } from '@kernel/decorators/schema';
import { Injectable } from 'src/kernel/decorators/injectable';
import {
  CreateLinkChargeSchemaBody,
  createLinkChargeBodySchema,
} from './schemas/create-link-charge.schema';

interface CreateLinkChargeControllerResponse {
  link: string;
}

@Injectable()
@Schema({
  type: 'BODY',
  schema: createLinkChargeBodySchema,
})
export class CreateLinkChargeController extends BaseController<
  'private',
  CreateLinkChargeControllerResponse
> {
  constructor(private readonly createLinkChargeUseCase: CreateLinkChargeUseCase) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', CreateLinkChargeSchemaBody>,
  ): Promise<BaseController.Response<CreateLinkChargeControllerResponse>> {
    const result = await this.createLinkChargeUseCase.execute({
      accountId: request.accountId,
      amount: request.body.amount,
    });

    return {
      statusCode: 201,
      body: {
        link: result.link,
      },
    };
  }
}
