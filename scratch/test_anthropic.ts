
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { SettingsService } from '../apps/api/src/modules/settings/settings.service';
import { AnthropicProvider } from '../apps/api/src/modules/ai/providers/anthropic.provider';

async function testAnthropic() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const settingsService = app.get(SettingsService);
  const anthropicProvider = app.get(AnthropicProvider);

  console.log('--- Anthropic Diagnostic Test ---');
  
  try {
    const config = await settingsService.getDecryptedApiKey('anthropic');
    console.log('Config Decrypted:', config ? 'Success (Key is hidden)' : 'Failed (Null)');
    
    if (config) {
        console.log('Key type:', typeof config === 'object' ? 'Object' : 'String');
        console.log('Has api_key field:', !!config.api_key);
        
        // Test a very simple completion
        console.log('Testing Anthropic connectivity...');
        const result = await anthropicProvider.complete(
            'Hello, say "test success"',
            'You are a test assistant.',
            10,
            0,
            'claude-3-5-sonnet-20241022',
            config
        );
        console.log('Result:', result.response);
    }
  } catch (error) {
    console.error('DIAGNOSTIC FAILED:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await app.close();
  }
}

testAnthropic();
