import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { FalWebhookSQSGateway } from '@infra/gateways/aws/fal-webhook-sqs.gateway';
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
    private readonly falWebhookSQSGateway: FalWebhookSQSGateway,
    private readonly appConfig: AppConfig,
  ) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'public', any, FalWebhookSchemaQuery>,
  ): Promise<BaseController.Response> {
    const { body, query } = request;

    if (query.secret !== this.appConfig.ai.falWebhookSecret) {
      throw new ApplicationError(ErrorCode.FORBIDDEN, 'Invalid webhook secret');
    }

    const requestId = body.request_id;
    const status = body.status === 'ERROR' ? 'ERROR' : 'OK';
    const payload = body.payload ?? body;
    const error = body.error;

    await this.falWebhookSQSGateway.publish({
      requestId,
      status,
      payload,
      error,
    });

    return {
      statusCode: 200,
    };
  }
}
