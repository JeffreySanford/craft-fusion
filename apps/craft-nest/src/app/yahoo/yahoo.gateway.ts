import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { YahooService, StockData } from './yahoo.service'; // Import StockData type from YahooService
import { Logger } from '@nestjs/common';

// We can still keep these internal interfaces if needed
interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'https://jeffreysanford.us'],
    credentials: true
  },
  namespace: 'yahoo'
})
export class YahooGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(YahooGateway.name);
  private readonly activeClients = new Map<string, Socket>();
  private readonly activeSubscriptions = new Map<string, { symbols: string[], interval: string, range: string }>();

  constructor(private readonly yahooService: YahooService) {
    this.logger.log('YahooGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.activeClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.activeClients.delete(client.id);
    this.activeSubscriptions.delete(client.id);
  }

  @SubscribeMessage('yahoo:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { symbols: string[], interval: string, range: string }
  ) {
    const { symbols, interval, range } = payload;
    this.logger.log(`Client ${client.id} subscribed to Yahoo data: ${symbols.join(',')}`);
    
    this.yahooService.getHistoricalData(symbols, interval, range).subscribe({
      next: (value: StockData[]) => {
        client.emit('yahoo:data', { data: value });
      },
      error: (error: Error) => {
        this.logger.error(`Error fetching Yahoo data: ${error.message}`);
        client.emit('yahoo:error', { message: 'Failed to fetch financial data' });
      }
    });
    
    return { event: 'yahoo:subscribe', data: { subscribed: true, symbols } };
  }

  @SubscribeMessage('yahoo:unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client ${client.id} unsubscribed from Yahoo data`);
    this.activeSubscriptions.delete(client.id);
    return { event: 'yahoo:unsubscribe', data: { unsubscribed: true } };
  }

  // Method to broadcast updates to all subscribed clients
  broadcastUpdates(symbols: string[]) {
    this.activeSubscriptions.forEach((subscription, clientId) => {
      // Only send updates for symbols the client is subscribed to
      const relevantSymbols = subscription.symbols.filter(s => symbols.includes(s));
      
      if (relevantSymbols.length > 0) {
        const client = this.activeClients.get(clientId);
        if (client) {
          this.yahooService.getHistoricalData(
            relevantSymbols, 
            subscription.interval, 
            subscription.range
          ).subscribe({
            next: (value: StockData[]) => {
              client.emit('yahoo:data', { data: value });
            },
            error: (error: unknown) => {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.logger.error(`Error sending update to client ${clientId}: ${errorMessage}`);
            }
          });
        }
      }
    });
  }
}
