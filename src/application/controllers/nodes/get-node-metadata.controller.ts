import { BaseController } from '@application/contracts/abstracts/base-controller';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { NodeDrizzleRepository } from '@infra/database/drizzle/repositories/node-drizzle.repository';
import { Injectable } from 'src/kernel/decorators/injectable';
import { Schema } from 'src/kernel/decorators/schema';
import { z } from 'zod';

const paramsSchema = z.object({
  flowId: z.string().min(1),
  nodeId: z.string().min(1),
});

type Params = z.infer<typeof paramsSchema>;

type ResponseBody = {
  ready: boolean;
  duration: number | null;
};

@Injectable()
@Schema({ type: 'PARAMS', schema: paramsSchema })
export class GetNodeMetadataController extends BaseController<'private', ResponseBody> {
  constructor(private readonly nodeRepository: NodeDrizzleRepository) {
    super();
  }

  protected override async handle(
    request: BaseController.Request<'private', {}, {}, Params>,
  ): Promise<BaseController.Response<ResponseBody>> {
    const node = await this.nodeRepository.findById(request.params.nodeId, request.params.flowId);

    if (!node) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Node not found');
    }

    if (!node.isVideo()) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE, 'Node is not a video type');
    }

    const duration = node.attrs.data.duration ?? null;

    return {
      statusCode: 200,
      body: {
        ready: duration !== null,
        duration,
      },
    };
  }
}
