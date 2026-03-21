import { getSchemaMetadata } from 'src/kernel/decorators/schema';

export abstract class BaseController<TRoute extends BaseController.RouteType, TBody = unknown> {
  protected abstract handle(
    request: BaseController.Request<TRoute>,
  ): Promise<BaseController.Response<TBody>>;

  public async execute(
    request: BaseController.Request<TRoute>,
  ): Promise<BaseController.Response<TBody>> {
    const requestData = this.validateSchema(request);
    return await this.handle(requestData);
  }

  private validateSchema(request: BaseController.Request<TRoute>): BaseController.Request<TRoute> {
    const schemaBody = getSchemaMetadata(this.constructor, 'BODY');
    const schemaQuery = getSchemaMetadata(this.constructor, 'QUERY');
    const schemaParams = getSchemaMetadata(this.constructor, 'PARAMS');

    return {
      body: schemaBody ? schemaBody.parse(request.body) : request.body,
      query: schemaQuery ? schemaQuery.parse(request.query) : request.query,
      params: schemaParams ? schemaParams.parse(request.params) : request.params,
      accountId: request.accountId,
      cookies: request.cookies,
      headers: request.headers,
    } as BaseController.Request<TRoute>;
  }
}

export namespace BaseController {
  export type RouteType = 'public' | 'private';

  type BaseRequest<
    TBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = {
    body: TBody;
    query: TQuery;
    params: TParams;
    cookies?: string[];
    headers?: Record<string, string | undefined>;
  };

  type PublicRequest<
    TBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = BaseRequest<TBody, TQuery, TParams> & {
    accountId: null;
  };

  type PrivateRequest<
    TBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = BaseRequest<TBody, TQuery, TParams> & {
    accountId: string;
  };

  export type Request<
    TType extends RouteType,
    TBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = TType extends 'public'
    ? PublicRequest<TBody, TQuery, TParams>
    : PrivateRequest<TBody, TQuery, TParams>;

  export type Response<TBody = undefined> = {
    statusCode: number;
    body?: TBody;
    cookies?: string[];
  };
}
