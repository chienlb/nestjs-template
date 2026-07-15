import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  private server: Server;

  /**
   * Set the Socket.io server instance (called by WebsocketGateway afterInit)
   */
  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Get the Socket.io server instance
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Broadcast message to all connected clients
   */
  sendToAll(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  /**
   * Send message to a specific user (via their user room: user:<userId>)
   */
  sendToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  /**
   * Send message to a specific room
   */
  sendToRoom(room: string, event: string, data: any) {
    if (this.server) {
      this.server.to(room).emit(event, data);
    }
  }
}
