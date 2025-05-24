import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { LoggingService } from '../logging/logging.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule], // <-- Import LoggingModule to provide LoggingService
  providers: [RecipesService],
  controllers: [RecipesController],
  exports: [RecipesService]
})
export class RecipesModule {
  constructor(private readonly loggingService: LoggingService) {
    this.loggingService.info('RecipesModule initialized', {
      timestamp: new Date().toISOString(),
      user: 'system',
      module: 'RecipesModule'
    });
  }
}
