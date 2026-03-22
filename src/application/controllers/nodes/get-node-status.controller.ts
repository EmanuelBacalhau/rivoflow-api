import { BaseController } from '@application/contracts/abstracts/base-controller';
import { NodeEntity } from '@application/entities/node.entity';
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
  status: string;
  result: NodeEntity.AllAttributes | null;
};

@Injectable()
@Schema({ type: 'PARAMS', schema: paramsSchema })
export class GetNodeStatusController extends BaseController<'private', ResponseBody> {
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

    if (!node.isAnyGeneration()) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE, 'Node is not a generation type');
    }

    const data = node.attrs.data as { status: string; outputNodeId: string | null };

    let result: NodeEntity.AllAttributes | null = null;

    if (data.outputNodeId) {
      const outputNode = await this.nodeRepository.findById(data.outputNodeId, request.params.flowId);
      if (outputNode) {
        result = outputNode.attrs;
      }
    }

    return {
      statusCode: 200,
      body: { status: data.status, result },
    };
  }
}
