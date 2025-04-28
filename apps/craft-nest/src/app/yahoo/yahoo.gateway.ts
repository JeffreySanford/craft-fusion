import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggingService } from '../logging/logging.service';
import { YahooService } from './yahoo.service';

@WebSocketGateway({
  namespace: 'yahoo',
  cors: {
    origin: '*',
    credentials: true
  }
})
export class YahooGateway {
  @WebSocketServer() server!: Server;
  private clientSubscriptions = new Map<string, Set<string>>();

  constructor(
    private yahooService: YahooService,
    private logger: LoggingService
  ) {}

  handleConnection(client: Socket): void {
    this.logger.info('Client connected to Yahoo gateway', { clientId: client.id });
    this.clientSubscriptions.set(client.id, new Set<string>());
  }

  handleDisconnect(client: Socket): void {
    this.logger.info('Client disconnected from Yahoo gateway', { 
      clientId: client.id,
      subscribedSymbols: Array.from(this.clientSubscriptions.get(client.id) || [])
    });
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribeToSymbols')
  async handleSubscribeToSymbols(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { symbols: string[] }
  ): Promise<void> {
    const { symbols } = payload;
    
    if (!symbols || !Array.isArray(symbols)) {
      this.logger.warn('Invalid subscription request', { clientId: client.id, payload });
      return;
    }

    const clientSubs = this.clientSubscriptions.get(client.id) || new Set<string>();
    
    symbols.forEach(symbol => clientSubs.add(symbol));
    this.clientSubscriptions.set(client.id, clientSubs);
    
    this.logger.info('Client subscribed to symbols', { 
      clientId: client.id,
      symbols,
      totalSubscriptions: clientSubs.size
    });

    try {
      const startTime = Date.now();
      const data = await this.yahooService.getHistoricalData(symbols);
      const duration = Date.now() - startTime;
      const dataPointCount = Array.isArray(data) ? data.length : 0;
      
      this.logger.debug('Sending historical data to client', {
        clientId: client.id,
        symbols,
        dataPoints: dataPointCount,
        duration: `${duration}ms`
      });
      
      client.emit('historicalData', { data });
    } catch (error) {
      this.logger.error('Failed to fetch historical data', {
        error,
        clientId: client.id,
        symbols
      });
      client.emit('error', { message: 'Failed to fetch historical data' });
    }
  }

  @SubscribeMessage('unsubscribeFromSymbols')
  handleUnsubscribeFromSymbols(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { symbols: string[] }
  ): void {
    const { symbols } = payload;
    const clientSubs = this.clientSubscriptions.get(client.id);
    
    if (!clientSubs) {
      return;
    }

    symbols.forEach(symbol => clientSubs.delete(symbol));
    
    this.logger.info('Client unsubscribed from symbols', {
      clientId: client.id,
      symbols,
      remainingSubscriptions: clientSubs.size
    });
  }
}
