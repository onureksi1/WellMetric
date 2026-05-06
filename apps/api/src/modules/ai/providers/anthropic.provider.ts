import { Injectable, ServiceUnavailableException, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  private readonly logger = new Logger(AnthropicProvider.name);

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
      const apiKey = config.api_key;
      this.logger.debug(`Anthropic API Key (masked): ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);
      
      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      const durationMs = Date.now() - start;
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;

      this.logger.debug(`[Anthropic] Success: ${model} - ${totalTokens} tokens in ${durationMs}ms`);

      return { response, inputTokens, outputTokens, totalTokens, durationMs };
    } catch (error) {
      this.logger.error(`[Anthropic] CRITICAL ERROR: ${error.message}`, {
        status: error.status,
        code: error.code,
        model,
        duration: Date.now() - start
      });
      
      if (error.status === 401) {
        throw new ServiceUnavailableException({
          code: 'AI_AUTH_FAILED',
          message: 'Anthropic API anahtarı geçersiz (401).',
        });
      }

      if (error.status === 429) {
        throw new ServiceUnavailableException({
          code: 'AI_RATE_LIMITED',
          message: 'AI servis limiti aşıldı, lütfen biraz bekleyin.',
        });
      }

      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE',
        message: `AI servisi şu anda yanıt vermiyor (Status: ${error.status}). Hata: ${error.message}`,
      });
    }
  }
}
