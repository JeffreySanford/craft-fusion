import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';

const jwtSecret = process.env['JWT_SECRET'] || 'dev_jwt_secret';
const jwtExpiry = process.env['JWT_EXPIRATION'] || '3600s';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiry },
    }),
    MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
  ],
  providers: [AuthenticationService, RefreshTokenService],
  controllers: [AuthenticationController],
  exports: [AuthenticationService, RefreshTokenService, JwtModule],
})
export class AuthenticationModule {}
