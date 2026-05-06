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
  ): Promise<{ response: string; inputTokens: number; outputTokens: number; totalTokens: number; durationMs: number }> {
    const start = Date.now();
    try {
      const apiKey = config.api_key;
      console.log(`OpenAI API Key (masked): ${apiKey ? apiKey.substring(0, 5) + '...' : 'MISSING'}`);
      
      const openai = new OpenAI({ 
        apiKey,
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
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = completion.usage?.total_tokens || 0;

      return { response, inputTokens, outputTokens, totalTokens, durationMs };
    } catch (error) {
      console.error(`!!! OPENAI CRITICAL ERROR !!!`, error);
      
      if (error.status === 401) {
        throw new ServiceUnavailableException({
          code: 'AI_AUTH_FAILED',
          message: 'OpenAI API anahtarı geçersiz veya yetkisiz (401).',
        });
      }

      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE',
        message: `OpenAI servisine şu anda erişilemiyor: ${error.message} (Status: ${error.status})`,
      });
    }
  }
}
