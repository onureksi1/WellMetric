import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { MistralProvider } from './providers/mistral.provider';
import { AzureOpenAIProvider } from './providers/azure-openai.provider';
import { AwsBedrockProvider } from './providers/aws-bedrock.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { HuggingFaceProvider } from './providers/huggingface.provider';
import { AIProvider } from './providers/ai-provider.interface';
import { SettingsService } from '../settings/settings.service';

export enum AITaskEnum {
  OPEN_TEXT_SUMMARY = 'open_text_summary',
  RISK_ALERT = 'risk_alert',
  ACTION_SUGGESTION = 'action_suggestion',
  TREND_ANALYSIS = 'trend_analysis',
  HR_CHAT = 'hr_chat',
  ADMIN_ANOMALY = 'admin_anomaly',
  ADMIN_CHAT = 'admin_chat',
  SURVEY_GENERATION = 'survey_generation',
  INTELLIGENCE_REPORT = 'intelligence_report',
  BENCHMARK_GENERATION = 'benchmark_generation',
  CONTENT_SUGGESTION = 'content_suggestion',
}

@Injectable()
export class AIProviderFactory {
  constructor(
    private readonly openai: OpenAIProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly google: GoogleProvider,
    private readonly mistral: MistralProvider,
    private readonly azure: AzureOpenAIProvider,
    private readonly bedrock: AwsBedrockProvider,
    private readonly ollama: OllamaProvider,
    private readonly huggingface: HuggingFaceProvider,
    private readonly settingsService: SettingsService,
  ) {}

  async getProvider(task: AITaskEnum): Promise<{ provider: AIProvider; model: string; config: any; settings: any }> {
    const settings = await this.settingsService.getSettings();
    if (!settings) {
      throw new InternalServerErrorException('Platform settings not found');
    }

    const taskConfig = settings.ai_task_models?.[task];
    const providerName = taskConfig?.provider || settings.ai_provider_default;
    const model = taskConfig?.model || settings.ai_model_default;

    if (!providerName || !model) {
      console.error('[DEBUG] AI configuration NOT FOUND for task:', task, 'Available tasks:', Object.keys(settings.ai_task_models || {}));
      throw new InternalServerErrorException(`AI configuration for task ${task} not found`);
    }
    console.log('[DEBUG] Task config found:', { task, providerName, model });
    const provider = this.resolveProvider(providerName);
    
    // Get decrypted config/API key for the provider
    const config = await this.settingsService.getDecryptedApiKey(providerName);

    return { provider, model, config, settings };
  }

  private resolveProvider(name: string): AIProvider {
    switch (name.toLowerCase()) {
      case 'openai':
        return this.openai;
      case 'anthropic':
        return this.anthropic;
      case 'google':
        return this.google;
      case 'mistral':
        return this.mistral;
      case 'azure_openai':
      case 'azure-openai':
        return this.azure;
      case 'aws_bedrock':
      case 'aws-bedrock':
        return this.bedrock;
      case 'ollama':
        return this.ollama;
      case 'huggingface':
        return this.huggingface;
      default:
        throw new InternalServerErrorException(`Unsupported AI provider: ${name}`);
    }
  }
}
