import { createZodDto, zodToOpenAPI } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { OpenAIFunction } from '../interfaces';

export const WeatherFunctionInputSchema = z.object({
  location: z.string(),
  unit: z.enum(['celcius', 'fahrenheit']),
});

export class WeatherFunctionInputDto extends createZodDto(
  WeatherFunctionInputSchema,
) {}

export class WeatherFunction
  implements OpenAIFunction<WeatherFunctionInputDto>
{
  name(): string {
    return 'get_weather';
  }

  description(): string {
    return 'Get the current weather for a location.';
  }

  schema(): any {
    return {
      name: this.name(),
      description: this.description(),
      parameters: zodToOpenAPI(WeatherFunctionInputSchema),
    };
  }

  async execute(data: WeatherFunctionInputDto): Promise<any> {
    const input = WeatherFunctionInputSchema.parse(data);
    // mocking the response for now
    return { weather: 'sunny', temperature: 75, unit: input.unit };
  }
}
