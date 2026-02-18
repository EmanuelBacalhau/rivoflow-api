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
    const schameBody = getSchemaMetadata(this.constructor, 'BODY');
    const schameQuery = getSchemaMetadata(this.constructor, 'QUERY');
    const schameParams = getSchemaMetadata(this.constructor, 'PARAMS');

    return {
      body: schameBody ? schameBody.parse(request.body) : request.body,
      query: schameQuery ? schameQuery.parse(request.query) : request.query,
      params: schameParams ? schameParams.parse(request.params) : request.params,
      accountId: request.accountId,
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
