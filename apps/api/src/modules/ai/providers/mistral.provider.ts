import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Mistral } from '@mistralai/mistralai';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class MistralProvider implements AIProvider {
  async complete(
    prompt: string,
    systemPrompt: string,
    maxTokens: number,
    temperature: number,
    model: string,
    config: any,
  ): Promise<{ response: string; inputTokens: number; outputTokens: number; totalTokens: number; durationMs: number }> {
    const start = Date.now();
    try {
      const client = new Mistral({ apiKey: config.api_key });
      const result = await client.chat.complete({
        model,
        maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });

      const response = result.choices?.[0]?.message?.content as string || '';
      const durationMs = Date.now() - start;
      const inputTokens = result.usage?.promptTokens || 0;
      const outputTokens = result.usage?.completionTokens || 0;
      const totalTokens = result.usage?.totalTokens || 0;

      return { response, inputTokens, outputTokens, totalTokens, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE',
        message: 'Mistral servisine şu anda erişilemiyor.',
      });
    }
  }
}
