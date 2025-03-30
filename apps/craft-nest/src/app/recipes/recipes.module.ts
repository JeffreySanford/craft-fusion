import { Module, OnModuleInit } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { LoggingModule } from '../logging/logging.module';
import { LoggingService } from '../logging/logging.service';

@Module({
  imports: [LoggingModule],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule implements OnModuleInit {
  constructor(private readonly loggingService: LoggingService) {}

  onModuleInit() {
    this.loggingService.info('RecipesModule initialized');
  }
}
