import { Module } from '@nestjs/common';
import { UserStateController } from './user-state.controller';
import { UserStateService } from './user-state.service';
import { FileModule } from '../documents/file.module';

@Module({
  imports: [FileModule],
  controllers: [UserStateController],
  providers: [UserStateService],
  exports: [UserStateService]
})
export class UserModule {}
