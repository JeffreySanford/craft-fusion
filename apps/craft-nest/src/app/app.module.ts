import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';
import { RecipesModule } from './recipes/recipes.module';
import { OpenSkyModule } from './openskies/opensky.module';
import { AlphaVantageModule } from './financial/alpha-vantage/alpha-vantage.module';
import { FileModule } from './documents/file.module';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { AuditingModule } from './auditing/auditing.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    RecordsModule,
    RecipesModule,
    OpenSkyModule,
    AlphaVantageModule,
    FileModule,
    UserModule,
    AuthenticationModule,
    AuthorizationModule,
    AuditingModule,
    LoggingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
