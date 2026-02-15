import {
  UpdateNodeSchemaBody,
  UpdateNodeSchemaParams,
} from '@application/controllers/nodes/schemas/update-node.schema';
import { UpdateNodeUseCaseInput } from '@application/use-cases/node/update-node.use-case';

export class UpdateNodeMapper {
  static toUseCaseInput(
    body: UpdateNodeSchemaBody,
    params: UpdateNodeSchemaParams,
  ): UpdateNodeUseCaseInput {
    return {
      flowId: body.flowId,
      nodeId: params.nodeId,
      nodeType: body.nodeType,
      data: 'data' in body ? body.data : undefined,
      position: body.position,
    };
  }
}
