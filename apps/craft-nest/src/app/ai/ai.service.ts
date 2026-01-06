import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../logging/logging.service';
import { summarizeForLog } from '../logging/logging.utils';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService, private readonly logger: LoggingService) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('OPENAI_API_KEY');
  }

  async generateFromPrompt(prompt: string, maxTokens = 500): Promise<string> {
    const key = this.apiKey;
    if (!key) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const payload = {
      promptPreview: this.buildPromptPreview(prompt),
      promptLength: prompt.length,
      maxTokens,
      model: 'gpt-4o-mini',
    };
    const startTime = Date.now();

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
        }),
      });

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
      this.logSuccess('generateFromPrompt', payload, { content, response: json, status: res.status, ok: res.ok }, startTime);
      return String(content ?? '');
    } catch (e: unknown) {
      this.logError('generateFromPrompt', payload, e, startTime);
      throw e;
    }
  }

  private logSuccess(operation: string, payload: Record<string, unknown>, result: unknown, startTime: number): void {
    this.logger.info('External API request success', {
      service: 'openai',
      operation,
      payload,
      result: summarizeForLog(result),
      durationMs: Date.now() - startTime,
      suppressConsole: true,
    });
  }

  private logError(operation: string, payload: Record<string, unknown>, error: unknown, startTime: number): void {
    this.logger.error('External API request error', {
      service: 'openai',
      operation,
      payload,
      error,
      durationMs: Date.now() - startTime,
      suppressConsole: true,
    });
  }

  private buildPromptPreview(prompt: string, maxLength = 200): string {
    if (prompt.length <= maxLength) {
      return prompt;
    }
    return `${prompt.slice(0, maxLength)}...`;
  }
}
