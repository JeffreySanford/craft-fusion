import { Module } from '@nestjs/common';
import { UserStateController } from './user-state.controller';
import { UserStateService } from './user-state.service';
import { FileService } from '../documents/file.service';

@Module({
  controllers: [UserStateController],
  providers: [UserStateService, FileService],
})
export class UserModule {}
