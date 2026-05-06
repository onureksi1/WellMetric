import { Injectable, Logger } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';
import axios from 'axios';

@Injectable()
export class HuggingFaceProvider implements AIProvider {
  private readonly logger = new Logger(HuggingFaceProvider.name);

  async complete(
    prompt: string,
    systemPrompt: string,
    maxTokens: number,
    temperature: number,
    model: string,
    config: any,
  ): Promise<{ response: string; inputTokens: number; outputTokens: number; totalTokens: number; durationMs: number }> {
    const startTime = Date.now();
    try {
      const apiKey = config.api_token;
      const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
      const url = `https://api-inference.huggingface.co/models/${model}`;
      
      const response = await axios.post(
        url,
        {
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            return_full_text: false,
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const text = Array.isArray(response.data) ? response.data[0].generated_text : response.data.generated_text;

      return {
        response: text || '',
        inputTokens: 0, 
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Hugging Face Error: ${error.message}`);
      throw error;
    }
  }
}
