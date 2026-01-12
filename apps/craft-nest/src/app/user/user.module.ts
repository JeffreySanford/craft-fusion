import { Module } from '@nestjs/common';
import { UserStateController } from './user-state.controller';
import { UserStateService } from './user-state.service';

@Module({
  imports: [],
  controllers: [UserStateController],
  providers: [UserStateService],
  exports: [UserStateService]
})
export class UserModule {}
