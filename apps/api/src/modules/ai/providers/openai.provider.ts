import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
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
      const openai = new OpenAI({ 
        apiKey: config.api_key,
        organization: config.organization_id 
      });
      const completion = await openai.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });

      const response = completion.choices[0].message.content || '';
      const durationMs = Date.now() - start;
      const tokensUsed = completion.usage?.total_tokens || 0;

      return { response, tokensUsed, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE',
        message: 'OpenAI servisine şu anda erişilemiyor.',
      });
    }
  }
}
