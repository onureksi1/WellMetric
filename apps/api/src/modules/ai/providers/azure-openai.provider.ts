import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider } from './ai-provider.interface';

@Injectable()
export class AzureOpenAIProvider implements AIProvider {
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
      // For Azure, config contains endpoint, deploymentName, apiVersion, apiKey
      const client = new OpenAI({
        apiKey: config.api_key,
        baseURL: `${config.endpoint_url}/openai/deployments/${config.deployment_name}`,
        defaultQuery: { 'api-version': config.api_version },
        defaultHeaders: { 'api-key': config.api_key },
      });

      const completion = await client.chat.completions.create({
        model: config.deployment_name,
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
        code: 'AI_UNAVAILABLE_AZURE',
        message: 'Azure OpenAI servisine şu anda erişilemiyor.',
      });
    }
  }
}
