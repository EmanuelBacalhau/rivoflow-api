import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class NodeValidationService {
  validateGeneratorNode(nodeGenerator: NodeEntity | undefined): NodeEntity {
    if (!nodeGenerator) {
      throw new ApplicationError(ErrorCode.RESOURCE_NOT_FOUND, 'Generator node not found');
    }

    if (!nodeGenerator.isGeneration()) {
      throw new ApplicationError(ErrorCode.INVALID_NODE_TYPE, 'Invalid node type for image generation');
    }

    const status = nodeGenerator.attrs.data.status;

    if (status === GenerationStatusEnum.PROCESSING) {
      throw new ApplicationError(ErrorCode.NODE_ALREADY_PROCESSING, 'Node is already being processed');
    }

    if (status === GenerationStatusEnum.COMPLETED) {
      throw new ApplicationError(ErrorCode.NODE_ALREADY_PROCESSED, 'Node has already been processed');
    }

    return nodeGenerator;
  }

  findPromptNode(nodes: NodeEntity[]): NodeEntity | undefined {
    return nodes.find((node) => node.isPrompt() && node.attrs.data.prompt);
  }

  findImageNodes(nodes: NodeEntity[]): NodeEntity[] {
    return nodes.filter((node) => node.isImage() && node.attrs.data.key);
  }
}
