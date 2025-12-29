import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [HttpModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService] // <-- Export FileService so it can be injected elsewhere
})
export class FileModule {}
