import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';
import { SocketClientService } from './socket-client.service';
import { LogEntry } from './logger.service';

@Injectable({ providedIn: 'root' })
export class LogStreamingService {
  constructor(
    private logger: LoggerService,
    private socketClient: SocketClientService,
  ) {

    this.socketClient.on<LogEntry>('log').subscribe((log: LogEntry) => {
      this.logger['processBackendLogs']([log]);
    });

    this.socketClient.connect();
  }
}
