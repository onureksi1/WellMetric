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
  ): Promise<{ response: string; tokensUsed: number; durationMs: number }> {
    const start = Date.now();
    try {
      // Mocked implementation for AWS Bedrock
      // In production, use @aws-sdk/client-bedrock-runtime
      const response = `[AWS Bedrock Mock Response for ${model}]`;
      const durationMs = Date.now() - start;
      const tokensUsed = 100;

      return { response, tokensUsed, durationMs };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'AI_UNAVAILABLE_BEDROCK',
        message: 'AWS Bedrock servisine şu anda erişilemiyor.',
      });
    }
  }
}
