import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class GoogleProvider implements AIProvider {
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
      const genAI = new GoogleGenerativeAI(config.api_key);
      const generativeModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      });

      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;
      const result = await generativeModel.generateContent(fullPrompt);
      const response = result.response.text();
      const durationMs = Date.now() - start;
      
      const inputTokens = result.response.usageMetadata?.promptTokenCount || 0;
      const outputTokens = result.response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = result.response.usageMetadata?.totalTokenCount || 0;

      return { response, inputTokens, outputTokens, totalTokens, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE',
        message: 'Google AI servisine şu anda erişilemiyor.',
      });
    }
  }
}
