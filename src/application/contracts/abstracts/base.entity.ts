import KSUID from 'ksuid';

/**
 * BaseEntity class that provides common attributes and methods for all entities.
 * @param Props - The type of the specific attributes for the entity.
 */
export abstract class BaseEntity<Props> {
  private _attrs: Props & BaseEntity.Attributes;

  constructor(attrs: Props & Partial<BaseEntity.Attributes>) {
    this._attrs = {
      id: attrs.id || KSUID.randomSync().string,
      createdAt: attrs.createdAt || new Date(),
      updatedAt: attrs.updatedAt || new Date(),
      ...attrs,
    };
  }

  public get attrs(): Readonly<Props & BaseEntity.Attributes> {
    return this._attrs;
  }

  updateAttributes(attrs: Partial<Props & BaseEntity.Attributes>): void {
    this._attrs = {
      ...this._attrs,
      ...attrs,
      updatedAt: attrs.updatedAt || new Date(),
    };
  }
}

export namespace BaseEntity {
  export type Attributes = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
