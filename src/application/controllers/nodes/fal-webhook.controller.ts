import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FalWebhookUseCase } from '@application/use-cases/nodes/fal-webhook.use-case';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { AppConfig } from 'src/shared/config/app.config';
import { FalWebhookSchemaQuery, falWebhookQuerySchema } from './schemas/fal-webhook.schema';

@Injectable()
@Schema({
  type: 'QUERY',
  schema: falWebhookQuerySchema,
})
export class FalWebhookController extends BaseController<'public'> {
  constructor(
    private readonly falWebhookUseCase: FalWebhookUseCase,
    private readonly appConfig: AppConfig,
  ) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', any, FalWebhookSchemaQuery>,
  ): Promise<BaseController.Response> {
    const { body, query } = request;

    console.info('FAL WEBHOOK RECEIVED:', JSON.stringify({ query, body }));

    if (query.secret !== this.appConfig.ai.falWebhookSecret) {
      throw new ApplicationError(ErrorCode.FORBIDDEN, 'Invalid webhook secret');
    }

    const requestId = body.request_id;
    const status = body.status === 'ERROR' ? 'ERROR' : 'OK';
    const payload = body.payload ?? body;
    const error = body.error;

    await this.falWebhookUseCase.execute({
      requestId,
      status,
      payload,
      error,
    });

    return { statusCode: 200 };
  }
}
