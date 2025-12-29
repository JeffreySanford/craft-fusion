import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';
import { RecipesModule } from './recipes/recipes.module';
import { OpenSkyModule } from './openskies/opensky.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    RecordsModule,
    RecipesModule,
    OpenSkyModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
