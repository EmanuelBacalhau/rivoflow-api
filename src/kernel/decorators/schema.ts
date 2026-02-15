import { ZodType } from 'zod';

enum SchemaTypeKey {
  BODY = 'custom:schema:body',
  QUERY = 'custom:schema:query',
  PARAMS = 'custom:schema:params',
}

type SchemaType = keyof typeof SchemaTypeKey;

interface SchemaParam {
  type: SchemaType;
  schema: ZodType;
}

export function Schema(params: SchemaParam): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(SchemaTypeKey[params.type], params.schema, target);
  };
}

export function getSchemaMetadata(target: any, type: SchemaType): ZodType | undefined {
  return Reflect.getMetadata(SchemaTypeKey[type], target);
}
