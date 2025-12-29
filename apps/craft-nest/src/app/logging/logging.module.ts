import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';

@Global() // Make the logging service available throughout the app
@Module({
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService]
})
export class LoggingModule {}
