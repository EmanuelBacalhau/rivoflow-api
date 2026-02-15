export interface IUseCase<Input = void, Output = void> {
  execute(params: Input): Promise<Output>;
}
