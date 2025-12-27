import { Module } from '@nestjs/common';
import { SecurityScanController } from './security-scan.controller';
import { SecurityScanService } from './security-scan.service';
import { SocketGatewayModule } from '../socket/socket.module';

@Module({
  imports: [SocketGatewayModule],
  controllers: [SecurityScanController],
  providers: [SecurityScanService],
  exports: [SecurityScanService]
})
export class SecurityScanModule {}
