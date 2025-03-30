import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NestOAuthService } from './nest-oauth.service';
import { OAuthController } from './oauth.controller';

@Module({
  imports: [HttpModule],
  controllers: [OAuthController],
  providers: [NestOAuthService],
  exports: [NestOAuthService]
})
export class OAuthModule {}
