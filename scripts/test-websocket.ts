import { io, Socket } from 'socket.io-client';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';

// 1. Custom ENV Parser
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        value = value.replace(/\\n/g, '\n');
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const PORT = process.env.PORT || '3000';
const SERVER_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

// Set up a mock user ID
const userId = 'ws-test-user-' + Math.floor(Math.random() * 1000);
const roomName = 'test-room-123';

console.log('=== WebSocket Client Integration Test ===');
console.log(`Server URL: ${SERVER_URL}`);
console.log(`Test User ID: ${userId}`);
console.log(`Test Room: ${roomName}\n`);

interface RoomNotificationPayload {
  type: string;
  user: string;
  message: string;
  timestamp: string;
}

interface RoomMessagePayload {
  room: string;
  sender: string;
  message: string;
  timestamp: string;
}

interface MessageResponsePayload {
  sender: string;
  message: unknown;
  timestamp: string;
}

// Helper to generate a valid JWT token
function generateToken(id: string): string {
  return jwt.sign({ id, sub: id }, JWT_SECRET, { expiresIn: '1h' });
}

function runTest() {
  const token = generateToken(userId);
  console.log(`Generated JWT Token: ${token.substring(0, 15)}...`);

  // Connect client 1 with JWT auth
  console.log('Connecting to WebSocket server with JWT auth...');
  const socket: Socket = io(SERVER_URL, {
    auth: { token },
  });

  // Connect client 2 with mock query param fallback to verify both authentication styles
  const mockUser2Id = 'mock-user-456';
  console.log(
    `Connecting second client with query param userId: ${mockUser2Id}...`,
  );
  const socket2: Socket = io(SERVER_URL, {
    query: { userId: mockUser2Id },
  });

  // Track event completion
  let receivedMessageEcho = false;
  let client1JoinedRoomNotification = false;
  let client2JoinedRoomNotification = false;
  let receivedRoomMessage = false;
  let client1LeftRoomNotification = false;

  const cleanup = () => {
    console.log('\nClosing sockets...');
    socket.disconnect();
    socket2.disconnect();
    console.log('Test complete!');
    process.exit(0);
  };

  // Setup Client 2 Event handlers first to observe Client 1 actions
  socket2.on('connect', () => {
    console.log(`[Client 2] Connected (ID: ${socket2.id})`);

    // Client 2 joins the test room
    socket2.emit('joinRoom', roomName, (response: unknown) => {
      console.log(`[Client 2] Join Room Response:`, response);
    });
  });

  socket2.on('roomNotification', (data: unknown) => {
    const payload = data as RoomNotificationPayload;
    console.log(`[Client 2] Room Notification Received:`, payload);
    if (payload.type === 'join' && payload.user === userId) {
      client1JoinedRoomNotification = true;
    }
    if (payload.type === 'join' && payload.user === mockUser2Id) {
      client2JoinedRoomNotification = true;
    }
    if (payload.type === 'leave' && payload.user === userId) {
      client1LeftRoomNotification = true;
    }
  });

  socket2.on('roomMessage', (data: unknown) => {
    const payload = data as RoomMessagePayload;
    console.log(`[Client 2] Room Message Received:`, payload);
    if (
      payload.sender === userId &&
      payload.message === 'Hello from WS client!'
    ) {
      receivedRoomMessage = true;
    }
  });

  // Setup Client 1 Event handlers
  socket.on('connect', () => {
    console.log(`[Client 1] Connected (ID: ${socket.id})`);

    // Test Event 1: Simple echo message
    console.log(`[Client 1] Emitting 'message'...`);
    socket.emit('message', 'Hello NestJS Gateway!');
  });

  socket.on('messageResponse', (data: unknown) => {
    const payload = data as MessageResponsePayload;
    console.log(`[Client 1] Received messageResponse:`, payload);
    receivedMessageEcho = true;

    // Test Event 2: Join room
    console.log(`[Client 1] Emitting 'joinRoom' for ${roomName}...`);
    socket.emit('joinRoom', roomName, (response: unknown) => {
      console.log(`[Client 1] Join Room Response:`, response);
    });
  });

  // Sequence runner using simple timeout steps to allow events to complete
  setTimeout(() => {
    if (socket.connected) {
      // Test Event 3: Send message to room
      console.log(`[Client 1] Emitting 'sendToRoom' message to ${roomName}...`);
      socket.emit('sendToRoom', {
        room: roomName,
        message: 'Hello from WS client!',
      });
    }
  }, 2000);

  setTimeout(() => {
    if (socket.connected) {
      // Test Event 4: Leave room
      console.log(`[Client 1] Emitting 'leaveRoom' for ${roomName}...`);
      socket.emit('leaveRoom', roomName);
    }
  }, 4000);

  // Assertions summary & cleanup
  setTimeout(() => {
    console.log('\n=== Test Assertions Summary ===');
    console.log(
      `- Connection and auth echo: ${receivedMessageEcho ? 'PASSED' : 'FAILED'}`,
    );
    console.log(
      `- Client 1 Room join notifications: ${client1JoinedRoomNotification ? 'PASSED' : 'FAILED'}`,
    );
    console.log(
      `- Client 2 Room join notifications: ${client2JoinedRoomNotification ? 'PASSED' : 'FAILED'}`,
    );
    console.log(
      `- Broadcast room message received: ${receivedRoomMessage ? 'PASSED' : 'FAILED'}`,
    );
    console.log(
      `- Client 1 Room leave notification: ${client1LeftRoomNotification ? 'PASSED' : 'FAILED'}`,
    );

    const allPassed =
      receivedMessageEcho &&
      client1JoinedRoomNotification &&
      client2JoinedRoomNotification &&
      receivedRoomMessage &&
      client1LeftRoomNotification;

    if (allPassed) {
      console.log('\n🎉 ALL WEBSOCKET TESTS PASSED!');
    } else {
      console.log('\n❌ SOME WEBSOCKET TESTS FAILED. Verify console logs.');
    }
    cleanup();
  }, 6000);

  socket.on('connect_error', (err) => {
    console.error('[Client 1] Connection error:', err.message);
  });

  socket2.on('connect_error', (err) => {
    console.error('[Client 2] Connection error:', err.message);
  });
}

runTest();
