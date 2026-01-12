import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HealthService } from './health.service';
import { Logger } from '@nestjs/common';
import { Subscription } from 'rxjs';

// Make health gateway publicly accessible with no auth requirements
@WebSocketGateway({
  cors: {
    origin: '*', // Consider restricting this in production
    methods: ['GET', 'POST']
  },
  namespace: 'health',
  transports: ['websocket', 'polling'],
})
export class HealthGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private clientsCount = 0;
  private metricsSubscription: Subscription | null = null;
  private readonly logger = new Logger(HealthGateway.name);

  constructor(private healthService: HealthService) {}

  afterInit() {
    this.logger.log('Health Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.clientsCount++;
    this.logger.log(`Client connected to health gateway: ${client.id}, total: ${this.clientsCount}`);
    
    // Start metrics emission if this is the first client
    if (this.clientsCount === 1) {
      this.startMetricsEmission();
    }
    
    // Send initial health data to the newly connected client
    this.healthService.getHealthStatus().subscribe(status => {
      client.emit('health:status', status);
    });
  }

  handleDisconnect(client: Socket) {
    this.clientsCount--;
    this.logger.log(`Client disconnected from health gateway: ${client.id}, total: ${this.clientsCount}`);

    // If no clients are connected, stop emitting metrics to save resources
    if (this.clientsCount === 0) {
      this.stopMetricsEmission();
    }
  }

  @SubscribeMessage('health:request')
  handleHealthRequest() {
    return this.healthService.getHealthStatus();
  }

  private startMetricsEmission() {
    if (this.metricsSubscription) return;
    
    // Subscribe to the health metrics observable and emit to all clients
      this.metricsSubscription = this.healthService.getHealthStatus().subscribe({
      next: status => {
        if (this.clientsCount > 0) {
          this.server.emit('health:metrics', status);
        }
      },
      error: error => {
        this.logger.error('Failed to emit health metrics', error);
      }
    });
  }

  private stopMetricsEmission() {
      if (this.metricsSubscription) {
        this.metricsSubscription.unsubscribe();
        this.metricsSubscription = null;
      this.logger.log('Stopped health metrics emission due to no connected clients');
    }
  }
}
