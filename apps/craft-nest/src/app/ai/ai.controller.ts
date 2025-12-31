import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

@Controller('internal/ai')
export class AiController {
  constructor(private readonly aiService: AiService, private readonly configService: ConfigService) {}

  @Post('generate')
  async generate(@Body() body: { prompt?: string; maxTokens?: number }) {
    if (!this.configService.get<string>('OPENAI_API_KEY')) {
      throw new HttpException('AI not configured on server', HttpStatus.NOT_IMPLEMENTED);
    }

    const prompt = body?.prompt ?? '';
    if (!prompt || String(prompt).trim().length === 0) {
      throw new HttpException('Prompt required', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.aiService.generateFromPrompt(String(prompt), body?.maxTokens ?? 500);
      return { result };
    } catch (e: unknown) {
      throw new HttpException(String(e), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
