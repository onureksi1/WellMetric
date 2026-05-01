import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  async complete(
    prompt: string,
    systemPrompt: string,
    maxTokens: number,
    temperature: number,
    model: string,
    config: any,
  ): Promise<{ response: string; tokensUsed: number; durationMs: number }> {
    const start = Date.now();
    try {
      const anthropic = new Anthropic({ apiKey: config.api_key });
      const message = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      const durationMs = Date.now() - start;
      const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

      return { response, tokensUsed, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE',
        message: 'Anthropic servisine şu anda erişilemiyor.',
      });
    }
  }
}
