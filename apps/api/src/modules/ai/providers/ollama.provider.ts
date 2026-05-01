import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';
import axios from 'axios';

@Injectable()
export class OllamaProvider implements AIProvider {
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
      const baseUrl = config.base_url || 'http://localhost:11434';
      const res = await axios.post(`${baseUrl}/api/generate`, {
        model: model,
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: temperature,
        }
      });

      const response = res.data.response || '';
      const durationMs = Date.now() - start;
      const tokensUsed = 0; // Ollama doesn't return tokens in a standard way easily

      return { response, tokensUsed, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE_OLLAMA',
        message: 'Ollama servisine şu anda erişilemiyor. Lütfen Base URL kontrol edin.',
      });
    }
  }
}
