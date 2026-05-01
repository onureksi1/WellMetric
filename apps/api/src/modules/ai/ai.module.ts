import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { AIProcessor } from './ai.processor';
import { AiInsight } from './entities/ai-insight.entity';
import { AIProviderFactory } from './ai-provider.factory';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { MistralProvider } from './providers/mistral.provider';
import { AzureOpenAIProvider } from './providers/azure-openai.provider';
import { AwsBedrockProvider } from './providers/aws-bedrock.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';
import { ContentModule } from '../content/content.module';
import { ScoreModule } from '../score/score.module';
import { NotificationModule } from '../notification/notification.module';
import { ReportModule } from '../report/report.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiInsight]),
    BullModule.registerQueue({
      name: 'ai-queue',
    }),
    SettingsModule,
    AuditModule,
    NotificationModule,
    forwardRef(() => ContentModule),
    forwardRef(() => ScoreModule),
    forwardRef(() => ReportModule),
    BillingModule,
  ],
  controllers: [AIController],
  providers: [
    AIService,
    AIProcessor,
    AIProviderFactory,
    AnthropicProvider,
    OpenAIProvider,
    GoogleProvider,
    MistralProvider,
    AzureOpenAIProvider,
    AwsBedrockProvider,
    OllamaProvider,
  ],
  exports: [AIService],
})
export class AIModule {}
