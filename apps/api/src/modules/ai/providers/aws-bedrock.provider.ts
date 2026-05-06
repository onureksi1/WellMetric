import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class AwsBedrockProvider implements AIProvider {
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
      // Mocked implementation for AWS Bedrock
      // In production, use @aws-sdk/client-bedrock-runtime
      const response = `[AWS Bedrock Mock Response for ${model}]`;
      const durationMs = Date.now() - start;
      const inputTokens = 50;
      const outputTokens = 50;
      const totalTokens = 100;

      return { response, inputTokens, outputTokens, totalTokens, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE_BEDROCK',
        message: 'AWS Bedrock servisine şu anda erişilemiyor.',
      });
    }
  }
}
