import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('OPENAI_API_KEY');
  }

  async generateFromPrompt(prompt: string, maxTokens = 500): Promise<string> {
    const key = this.apiKey;
    if (!key) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens
        })
      });

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
      return String(content ?? '');
    } catch (e: unknown) {
      this.logger.warn('AI generation error: ' + String(e));
      throw e;
    }
  }
}
