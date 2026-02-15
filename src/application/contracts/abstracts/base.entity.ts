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

  /**
   * Gets the attributes of the entity as a read-only object.
   * @returns Readonly object containing the entity's attributes.
   */
  public get attrs(): Readonly<Props & BaseEntity.Attributes> {
    return {
      ...this._attrs,
    };
  }

  /**
   * Updates the attributes of the entity.
   * @param attrs - Partial object containing the attributes to be updated.
   */
  updateAttributes(attrs: Partial<Props & BaseEntity.Attributes>): void {
    this._attrs = {
      ...this._attrs,
      ...attrs,
      updatedAt: new Date(),
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
