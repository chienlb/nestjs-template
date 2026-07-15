import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { verifyJwt } from '../../common/utils/token.util';
import { WebsocketService } from './websocket.service';

// Safe SocketUser interface to prevent ESLint rules on 'any' type
interface SocketUser {
  id: string;
  isMock?: boolean;
}

// Custom interface to attach user data to Socket client
interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

@WebSocketGateway({
  cors: true, // Overridden dynamically by SocketIoAdapter
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);
  }

  handleConnection(client: AuthenticatedSocket) {
    const token = this.extractToken(client);
    const jwtSecret =
      this.configService.get<string>('jwt.secret') || 'defaultSecret';

    if (token) {
      try {
        const decoded = verifyJwt<Record<string, unknown>>(token, jwtSecret);
        const userId = (decoded['id'] ||
          decoded['sub'] ||
          decoded['userId'] ||
          '') as string;

        if (userId) {
          client.user = { id: userId };
          void client.join(`user:${userId}`);
          this.logger.log(
            `Client authenticated: user:${userId} (Socket ID: ${client.id})`,
          );
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Client connection token verification failed: ${errMsg}`,
        );
      }
    } else {
      // Fallback for demo: allow custom mock userId from query string if no JWT token is passed
      const mockUserId = client.handshake.query['userId'];
      if (typeof mockUserId === 'string' && mockUserId) {
        client.user = { id: mockUserId, isMock: true };
        void client.join(`user:${mockUserId}`);
        this.logger.log(
          `Client connected with mock ID: user:${mockUserId} (Socket ID: ${client.id})`,
        );
      } else {
        this.logger.log(`Anonymous client connected (Socket ID: ${client.id})`);
      }
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const identifier = client.user?.id || client.id;
    this.logger.log(`Client disconnected: ${identifier}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: AuthenticatedSocket, payload: unknown) {
    const sender = client.user?.id || 'Anonymous';
    this.logger.log(
      `Received message from ${sender}: ${JSON.stringify(payload)}`,
    );

    // Echo back the message along with a timestamp
    return {
      event: 'messageResponse',
      data: {
        sender,
        message: payload,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: AuthenticatedSocket, room: string) {
    const sender = client.user?.id || client.id;
    void client.join(room);
    this.logger.log(`Client ${sender} joined room: ${room}`);

    // Notify others in the room
    this.server.to(room).emit('roomNotification', {
      type: 'join',
      user: sender,
      message: `User ${sender} has joined the room.`,
      timestamp: new Date().toISOString(),
    });

    return { status: 'success', room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: AuthenticatedSocket, room: string) {
    const sender = client.user?.id || client.id;
    void client.leave(room);
    this.logger.log(`Client ${sender} left room: ${room}`);

    // Notify others in the room
    this.server.to(room).emit('roomNotification', {
      type: 'leave',
      user: sender,
      message: `User ${sender} has left the room.`,
      timestamp: new Date().toISOString(),
    });

    return { status: 'success', room };
  }

  @SubscribeMessage('sendToRoom')
  handleSendToRoom(
    client: AuthenticatedSocket,
    payload: { room: string; message: string },
  ) {
    const sender = client.user?.id || client.id;
    if (!payload.room || !payload.message) {
      return {
        status: 'error',
        message: 'Room and message parameters are required.',
      };
    }

    this.server.to(payload.room).emit('roomMessage', {
      room: payload.room,
      sender,
      message: payload.message,
      timestamp: new Date().toISOString(),
    });

    return { status: 'success' };
  }

  private extractToken(client: Socket): string | null {
    // 1. Check handshake authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1] || null;
    }

    // 2. Check handshake auth payload (socket.io client auth object)
    const authObj = client.handshake.auth as
      Record<string, unknown> | undefined;
    const tokenFromAuth = authObj?.['token'];
    if (typeof tokenFromAuth === 'string') {
      return tokenFromAuth;
    }

    // 3. Check handshake query parameters
    const tokenFromQuery = client.handshake.query['token'];
    if (typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    return null;
  }
}
