import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { HttpModule } from '@nestjs/axios';
import { RecordsModule } from './records/records.module';
import { RecipesModule } from './recipes/recipes.module';
import { OpenSkyController } from './openskies/opensky.controller';
import { OpenSkyService } from './openskies/opensky.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    HttpModule,
    RecordsModule,
    RecipesModule,
  ],
  controllers: [AppController, OpenSkyController, OpenSkyController],
  providers: [AppService, OpenSkyService],
})
export class AppModule {}
