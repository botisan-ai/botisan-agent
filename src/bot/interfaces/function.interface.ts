export interface OpenAIFunction<TInput = any, TOutput = any> {
  name(): string;
  description(): string;
  schema(): any;
  execute(data: TInput): Promise<TOutput>;
}
