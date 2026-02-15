import { BaseEntity } from '@application/contracts/abstracts/base.entity';

export class EdgeEntity extends BaseEntity<EdgeEntity.Attributes> {}

export namespace EdgeEntity {
  export type Attributes = {
    sourceNodeId: string;
    targetNodeId: string;
    flowId: string;
  };

  export type AllAttributes = Attributes & BaseEntity.Attributes;
}
