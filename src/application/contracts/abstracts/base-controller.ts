import { getSchemaMetadata } from 'src/kernel/decorators/schema';

export abstract class BaseController<
  TRoute extends BaseController.RouteType,
  TResponseBody = unknown,
  TRequestBody = Record<string, unknown>,
  TRequestQuery = Record<string, unknown>,
  TRequestParams = Record<string, unknown>,
> {
  protected abstract handle(
    request: BaseController.Request<TRoute, TRequestBody, TRequestQuery, TRequestParams>,
  ): Promise<BaseController.Response<TResponseBody>>;

  public async execute(
    request: BaseController.Request<TRoute, TRequestBody, TRequestQuery, TRequestParams>,
  ): Promise<BaseController.Response<TResponseBody>> {
    const requestData = this.validateSchema(request);
    return await this.handle(requestData);
  }

  private validateSchema(
    request: BaseController.Request<TRoute, TRequestBody, TRequestQuery, TRequestParams>,
  ): BaseController.Request<TRoute, TRequestBody, TRequestQuery, TRequestParams> {
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
    } as BaseController.Request<TRoute, TRequestBody, TRequestQuery, TRequestParams>;
  }
}

export namespace BaseController {
  export type RouteType = 'public' | 'private';

  type BaseRequest<
    TResponseBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = {
    body: TResponseBody;
    query: TQuery;
    params: TParams;
    cookies?: string[];
    headers?: Record<string, string | undefined>;
  };

  type PublicRequest<
    TResponseBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = BaseRequest<TResponseBody, TQuery, TParams> & {
    accountId: null;
  };

  type PrivateRequest<
    TResponseBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = BaseRequest<TResponseBody, TQuery, TParams> & {
    accountId: string;
  };

  export type Request<
    TType extends RouteType,
    TResponseBody = Record<string, unknown>,
    TQuery = Record<string, unknown>,
    TParams = Record<string, unknown>,
  > = TType extends 'public'
    ? PublicRequest<TResponseBody, TQuery, TParams>
    : PrivateRequest<TResponseBody, TQuery, TParams>;

  export type Response<TResponseBody = undefined> = {
    statusCode: number;
    body?: TResponseBody;
    cookies?: string[];
  };
}
