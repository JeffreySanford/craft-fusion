import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';

function normalizeExpiry(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) {
    return '3600s';
  }
  if (/^\d+$/.test(value)) {
    return `${value}s`;
  }
  return value;
}

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET') || 'dev_jwt_secret';
        const expiry = normalizeExpiry(config.get<string>('JWT_EXPIRATION'));
        return {
          secret,
          signOptions: { expiresIn: expiry },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
  ],
  providers: [AuthenticationService, RefreshTokenService],
  controllers: [AuthenticationController],
  exports: [AuthenticationService, RefreshTokenService, JwtModule],
})
export class AuthenticationModule {}
