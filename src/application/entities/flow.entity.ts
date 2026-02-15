import { BaseEntity } from '@application/contracts/abstracts/base.entity';
import { Optional } from '@application/types/optional';
import { EdgeEntity } from './edge.entity';
import { NodeEntity } from './node.entity';

export class FlowEntity extends BaseEntity<FlowEntity.Attributes> {
  constructor(
    attrs: Optional<FlowEntity.Attributes, 'nodes' | 'edges'> & Partial<BaseEntity.Attributes>,
  ) {
    super({
      ...attrs,
      nodes: attrs.nodes || [],
      edges: attrs.edges || [],
    });
  }

  set nodes(nodes: NodeEntity[]) {
    this.updateAttributes({
      nodes,
    });
  }

  set edges(edges: EdgeEntity[]) {
    this.updateAttributes({
      edges,
    });
  }
}

export namespace FlowEntity {
  export type Attributes = {
    title: string;
    projectId: string;
    nodes: NodeEntity[];
    edges: EdgeEntity[];
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
