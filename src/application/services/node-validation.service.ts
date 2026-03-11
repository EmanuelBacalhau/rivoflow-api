import { NodeEntity } from '@application/entities/node.entity';
import { GenerationStatusEnum } from '@application/entities/node-enums';
import { InvalidNodeTypeError } from '@application/errors/application/invalid-node-type.error';
import { NodeAlreadyProcessedError } from '@application/errors/application/node-already-processed.error';
import { NodeAlreadyProcessingError } from '@application/errors/application/node-already-processing.error';
import { ResourceNotFoundError } from '@application/errors/application/resource-not-found.error';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class NodeValidationService {
  validateGeneratorNode(nodeGenerator: NodeEntity | undefined): NodeEntity {
    if (!nodeGenerator) {
      throw new ResourceNotFoundError('Generator node not found');
    }

    if (nodeGenerator.attrs.data.type !== NodeEntity.NodeType.GENERATION_IMAGE) {
      throw new InvalidNodeTypeError('Invalid node type for image generation');
    }

    const status = nodeGenerator.attrs.data.status;

    if (status === GenerationStatusEnum.PROCESSING) {
      throw new NodeAlreadyProcessingError('Node is already being processed');
    }

    if (status === GenerationStatusEnum.COMPLETED) {
      throw new NodeAlreadyProcessedError('Node has already been processed');
    }

    return nodeGenerator;
  }

  findPromptNode(nodes: NodeEntity[]): NodeEntity {
    const promptNode = nodes.find(
      (node) => node.attrs.data.type === NodeEntity.NodeType.PROMPT && node.attrs.data.prompt,
    );

    if (!promptNode) {
      throw new ResourceNotFoundError('Prompt node not found');
    }

    return promptNode;
  }

  findImageNodes(nodes: NodeEntity[]): NodeEntity[] {
    return nodes.filter(
      (node) =>
        (node.attrs.data.type === NodeEntity.NodeType.IMAGE ||
          node.attrs.data.type === NodeEntity.NodeType.RESULT_IMAGE) &&
        node.attrs.data.key,
    );
  }
}
