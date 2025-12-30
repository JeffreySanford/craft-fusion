import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { FileModule } from './documents/file.module';
import { SocketGatewayModule } from './socket/socket.module';
import { AuthModule } from './auth/auth.module';
import { UserStateModule } from './user-state/user-state.module';
import { RecordsModule } from './records/records.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Try multiple paths so running from dist or the repo root finds the .env file
      envFilePath: ['.env', '../.env', '../../.env', '../../../.env'],
    }),
    FileModule,  // Add FileModule import to make FileService available
    UserModule,
    SocketGatewayModule,
    AuthModule,
    UserStateModule,
    RecordsModule,
    RecipesModule, // <-- Register RecipesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
