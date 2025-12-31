import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'auth',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AuthGateway.name);
  private connectedClients = new Map<string, any>();

  constructor(
    private jwtService: JwtService,
    @InjectConnection() private connection: Connection,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(`Auth WebSocket client connected: ${client.id}`);

    // Listen for authentication message
    client.on('authenticate', async (data: { token: string }) => {
      try {
        const payload = this.jwtService.verify(data.token);
        const usersColl = this.connection.collection('users');
        const user = await usersColl.findOne({ _id: payload.sub });

        if (user) {
          this.connectedClients.set(client.id, {
            userId: user._id.toString(),
            username: user['username'],
            client: client
          });

          this.logger.debug(`Auth WebSocket authenticated: ${user['username']}`);

          // Send confirmation
          client.emit('authenticated', {
            success: true,
            user: {
              id: user._id.toString(),
              username: user['username'],
              roles: user['roles'] || []
            }
          });
        } else {
          client.emit('authenticated', {
            success: false,
            message: 'User not found'
          });
          client.disconnect();
        }
      } catch (error) {
        this.logger.error(`Auth WebSocket authentication failed: ${(error as Error).message}`);
        client.emit('authenticated', {
          success: false,
          message: 'Invalid token'
        });
        client.disconnect();
      }
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.debug(`Auth WebSocket client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // Method to send messages to specific users
  sendToUser(userId: string, event: string, data: any) {
    for (const [, clientData] of this.connectedClients.entries()) {
      if (clientData.userId === userId) {
        clientData.client.emit(event, data);
        this.logger.debug(`Sent ${event} to user ${userId}`);
      }
    }
  }

  // Method to send messages to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcasted ${event} to all auth clients`);
  }

  // Method to force logout a specific user
  forceLogout(userId: string, reason?: string) {
    this.sendToUser(userId, 'force_logout', {
      message: reason || 'You have been logged out by an administrator.'
    });
  }

  // Method to notify user of permission changes
  notifyPermissionsUpdated(userId: string) {
    this.sendToUser(userId, 'permissions_updated', {
      timestamp: new Date().toISOString()
    });
  }

  // Method to notify user of session expiration
  notifySessionExpired(userId: string) {
    this.sendToUser(userId, 'session_expired', {});
  }
}