import { Controller, Get, Post, Body, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { WebsocketService } from './modules/websocket/websocket.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly websocketService: WebsocketService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('websocket-demo')
  @Header('Content-Type', 'text/html')
  getWebsocketDemo(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NestJS WebSockets Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0f0c1b 0%, #06050b 100%);
      --card-bg: rgba(22, 20, 38, 0.6);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --accent-primary: #8b5cf6;
      --accent-secondary: #3b82f6;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --accent-yellow: #f59e0b;
      --input-bg: rgba(10, 8, 18, 0.8);
      --input-border: rgba(255, 255, 255, 0.1);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      overflow-x: hidden;
      position: relative;
    }
    
    /* Background glows */
    body::before, body::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      filter: blur(120px);
      z-index: -1;
      opacity: 0.25;
    }
    
    body::before {
      background: var(--accent-primary);
      top: 10%;
      left: 10%;
    }
    
    body::after {
      background: var(--accent-secondary);
      bottom: 10%;
      right: 10%;
    }
    
    header {
      text-align: center;
      margin-bottom: 2rem;
      z-index: 10;
    }
    
    header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(to right, #a78bfa, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    
    header p {
      color: var(--text-muted);
      font-size: 1rem;
    }
    
    .container {
      max-width: 1200px;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2rem;
      z-index: 10;
    }
    
    @media (max-width: 900px) {
      .container {
        grid-template-columns: 1fr;
      }
    }
    
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 1.5rem;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.75rem;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      background: rgba(0, 0, 0, 0.2);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-red);
    }
    
    .status-dot.connected {
      background: var(--accent-green);
      box-shadow: 0 0 10px var(--accent-green);
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.6; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.6; }
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    
    .input-row {
      display: flex;
      gap: 0.5rem;
    }
    
    input, select {
      flex: 1;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 0.5rem;
      padding: 0.75rem;
      color: var(--text-main);
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
    }
    
    input:focus, select:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
    }
    
    button {
      background: linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    button.btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    button.btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      box-shadow: none;
    }
    
    button.btn-danger {
      background: var(--accent-red);
    }
    button.btn-danger:hover {
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }
    
    .panel-section {
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 0.75rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .panel-section h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #a78bfa;
    }
    
    .logs-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 450px;
    }
    
    .logs-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    
    .logs-viewport {
      flex: 1;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 0.75rem;
      padding: 1rem;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      overflow-y: auto;
      max-height: 500px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .log-entry {
      padding: 0.5rem;
      border-radius: 0.25rem;
      line-height: 1.4;
      border-left: 3px solid #6b7280;
      background: rgba(255, 255, 255, 0.02);
      word-break: break-all;
    }
    
    .log-entry.info {
      border-left-color: var(--accent-secondary);
      color: #93c5fd;
    }
    
    .log-entry.success {
      border-left-color: var(--accent-green);
      color: #6ee7b7;
    }
    
    .log-entry.error {
      border-left-color: var(--accent-red);
      color: #fca5a5;
    }
    
    .log-entry.warn {
      border-left-color: var(--accent-yellow);
      color: #fde047;
    }
    
    .log-time {
      color: var(--text-muted);
      font-size: 0.75rem;
      margin-right: 0.5rem;
    }
    
    .badge-user {
      background: rgba(139, 92, 246, 0.2);
      color: #c084fc;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .badge-room {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <header>
    <h1>WebSockets Real-time Dashboard</h1>
    <p>NestJS template real-time event system visual debugger</p>
  </header>
  
  <div class="container">
    <!-- Controls Panel -->
    <div class="card">
      <div class="card-title">
        <span>Gateway Controls</span>
        <div class="status-badge">
          <div id="statusDot" class="status-dot"></div>
          <span id="statusText">Disconnected</span>
        </div>
      </div>
      
      <!-- Connection configuration -->
      <div class="panel-section">
        <h3>1. Connection Configuration</h3>
        <div class="form-group">
          <label for="serverUrl">WebSocket URL</label>
          <input type="text" id="serverUrl" value="http://localhost:3000">
        </div>
        
        <div class="form-group">
          <label for="mockUserId">Mock User ID (For Guest Connection / Testing)</label>
          <input type="text" id="mockUserId" placeholder="e.g., user_1234">
        </div>

        <div class="form-group">
          <label for="jwtToken">JWT Token (Optional Bearer Auth)</label>
          <input type="text" id="jwtToken" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
        </div>
        
        <div class="input-row">
          <button id="connectBtn">Connect</button>
          <button id="disconnectBtn" class="btn-secondary">Disconnect</button>
        </div>
      </div>
      
      <!-- Testing basic messages -->
      <div class="panel-section">
        <h3>2. Emit Basic Message</h3>
        <div class="form-group">
          <label for="messagePayload">Payload</label>
          <div class="input-row">
            <input type="text" id="messagePayload" placeholder="Hello from client!">
            <button id="sendMsgBtn">Send Event 'message'</button>
          </div>
        </div>
      </div>
      
      <!-- Room control -->
      <div class="panel-section">
        <h3>3. Room Management</h3>
        <div class="form-group">
          <label for="roomName">Room Name</label>
          <input type="text" id="roomName" value="general-chat">
        </div>
        <div class="input-row">
          <button id="joinRoomBtn">Join Room</button>
          <button id="leaveRoomBtn" class="btn-secondary">Leave Room</button>
        </div>
        <div class="form-group" style="margin-top: 0.5rem;">
          <label for="roomMsgPayload">Message to Room</label>
          <div class="input-row">
            <input type="text" id="roomMsgPayload" placeholder="Hey room members!">
            <button id="sendRoomMsgBtn">Send to Room</button>
          </div>
        </div>
      </div>

      <!-- HTTP REST Broadcast simulation -->
      <div class="panel-section">
        <h3>4. Simulate HTTP REST Broadcast</h3>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">
          Triggers a REST API call on the server, which calls WebsocketService to broadcast.
        </p>
        <div class="form-group">
          <label for="restTargetType">Broadcast Target</label>
          <select id="restTargetType">
            <option value="all">Broadcast to All Connected Clients</option>
            <option value="user">Send to Specific User ID</option>
            <option value="room">Send to Room</option>
          </select>
        </div>
        <div id="restTargetIdGroup" class="form-group" style="display: none;">
          <label id="restTargetIdLabel" for="restTargetId">Target ID</label>
          <input type="text" id="restTargetId" placeholder="e.g. user_1234">
        </div>
        <div class="form-group">
          <label for="restMsgPayload">Notification Message</label>
          <div class="input-row">
            <input type="text" id="restMsgPayload" value="System notification from REST API!">
            <button id="triggerRestBtn" class="btn-secondary" style="border: 1px solid var(--accent-primary); color: #c084fc;">Trigger REST POST</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Logs Panel -->
    <div class="card logs-container">
      <div class="logs-actions">
        <span style="font-size: 1.1rem; font-weight: 600;">Real-time Events Log</span>
        <button id="clearLogsBtn" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Clear Logs</button>
      </div>
      <div id="logsViewport" class="logs-viewport">
        <div class="log-entry info">
          <span class="log-time">[System]</span>
          Welcome! Customize settings on the left and click 'Connect' to initiate WebSocket connection.
        </div>
      </div>
    </div>
  </div>

  <script>
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const serverUrlInput = document.getElementById('serverUrl');
    const mockUserIdInput = document.getElementById('mockUserId');
    const jwtTokenInput = document.getElementById('jwtToken');
    const logsViewport = document.getElementById('logsViewport');
    
    // Buttons
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const sendMsgBtn = document.getElementById('sendMsgBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const sendRoomMsgBtn = document.getElementById('sendRoomMsgBtn');
    const triggerRestBtn = document.getElementById('triggerRestBtn');
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    
    // Inputs
    const messagePayload = document.getElementById('messagePayload');
    const roomName = document.getElementById('roomName');
    const roomMsgPayload = document.getElementById('roomMsgPayload');
    const restTargetType = document.getElementById('restTargetType');
    const restTargetIdGroup = document.getElementById('restTargetIdGroup');
    const restTargetIdLabel = document.getElementById('restTargetIdLabel');
    const restTargetId = document.getElementById('restTargetId');
    const restMsgPayload = document.getElementById('restMsgPayload');
    
    let socket = null;

    // Log function
    function log(type, message, details = null) {
      const entry = document.createElement('div');
      entry.className = 'log-entry ' + type;
      
      const time = document.createElement('span');
      time.className = 'log-time';
      const now = new Date();
      time.textContent = '[' + now.toTimeString().split(' ')[0] + ']';
      entry.appendChild(time);
      
      const text = document.createElement('span');
      text.textContent = message;
      entry.appendChild(text);
      
      if (details) {
        const pre = document.createElement('pre');
        pre.style.margin = '0.5rem 0 0 0';
        pre.style.fontSize = '0.75rem';
        pre.style.color = '#cbd5e1';
        pre.style.background = 'rgba(0,0,0,0.3)';
        pre.style.padding = '0.5rem';
        pre.style.borderRadius = '0.25rem';
        pre.textContent = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
        entry.appendChild(pre);
      }
      
      logsViewport.appendChild(entry);
      logsViewport.scrollTop = logsViewport.scrollHeight;
    }

    clearLogsBtn.addEventListener('click', () => {
      logsViewport.innerHTML = '';
      log('info', 'Logs cleared.');
    });

    // Handle REST targeting toggle
    restTargetType.addEventListener('change', () => {
      const val = restTargetType.value;
      if (val === 'all') {
        restTargetIdGroup.style.display = 'none';
      } else {
        restTargetIdGroup.style.display = 'flex';
        restTargetIdLabel.textContent = val === 'user' ? 'Target User ID' : 'Target Room Name';
        restTargetId.placeholder = val === 'user' ? 'e.g. user_1234' : 'e.g. general-chat';
      }
    });

    // Connect logic
    connectBtn.addEventListener('click', () => {
      if (socket) {
        log('warn', 'Socket is already connecting or connected. Disconnect first.');
        return;
      }
      
      const serverUrl = serverUrlInput.value.trim();
      const mockUserId = mockUserIdInput.value.trim();
      const jwtToken = jwtTokenInput.value.trim();
      
      const options = {
        transports: ['websocket'],
        auth: {},
        query: {}
      };
      
      if (jwtToken) {
        options.auth.token = jwtToken;
        log('info', 'Adding JWT token to auth handshake payload.');
      }
      
      if (mockUserId) {
        options.query.userId = mockUserId;
        log('info', 'Adding mock User ID: "' + mockUserId + '" to query string.');
      }
      
      log('info', 'Connecting to WebSocket server: ' + serverUrl + '...');
      
      socket = io(serverUrl, options);
      
      socket.on('connect', () => {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
        log('success', 'Successfully connected! (Socket ID: ' + socket.id + ')');
      });
      
      socket.on('disconnect', (reason) => {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Disconnected';
        log('warn', 'Socket disconnected: ' + reason);
        socket = null;
      });
      
      socket.on('connect_error', (err) => {
        statusDot.className = 'status-dot';
        statusText.textContent = 'Connection Error';
        log('error', 'Connection error occurred: ' + err.message);
        socket = null;
      });
      
      // Setup general listeners
      socket.on('messageResponse', (data) => {
        log('success', 'Received [messageResponse] from server:', data);
      });
      
      socket.on('roomNotification', (data) => {
        log('info', '[roomNotification] ' + data.message, data);
      });
      
      socket.on('roomMessage', (data) => {
        log('success', 'Room [' + data.room + '] message from user ' + data.sender + ': "' + data.message + '"', data);
      });
      
      // Dynamic listener for generic server notification events
      socket.on('notification', (data) => {
        log('warn', '[notification] Received global event notification:', data);
      });
    });

    // Disconnect logic
    disconnectBtn.addEventListener('click', () => {
      if (!socket) {
        log('warn', 'Socket is not connected.');
        return;
      }
      socket.disconnect();
    });

    // Send generic event 'message'
    sendMsgBtn.addEventListener('click', () => {
      if (!socket || !socket.connected) {
        log('error', 'Cannot send: socket is not connected.');
        return;
      }
      const val = messagePayload.value.trim();
      if (!val) return;
      
      log('info', 'Sending event \\'message\\' to server with payload: "' + val + '"');
      socket.emit('message', val, (ack) => {
        log('success', 'Ack received:', ack);
      });
    });

    // Join room
    joinRoomBtn.addEventListener('click', () => {
      if (!socket || !socket.connected) {
        log('error', 'Cannot join room: socket is not connected.');
        return;
      }
      const room = roomName.value.trim();
      if (!room) return;
      
      log('info', 'Sending event \\'joinRoom\\' for room: "' + room + '"');
      socket.emit('joinRoom', room, (ack) => {
        log('success', 'Joined room callback response:', ack);
      });
    });

    // Leave room
    leaveRoomBtn.addEventListener('click', () => {
      if (!socket || !socket.connected) {
        log('error', 'Cannot leave room: socket is not connected.');
        return;
      }
      const room = roomName.value.trim();
      if (!room) return;
      
      log('info', 'Sending event \\'leaveRoom\\' for room: "' + room + '"');
      socket.emit('leaveRoom', room, (ack) => {
        log('success', 'Left room callback response:', ack);
      });
    });

    // Send room message
    sendRoomMsgBtn.addEventListener('click', () => {
      if (!socket || !socket.connected) {
        log('error', 'Cannot send room message: socket is not connected.');
        return;
      }
      const room = roomName.value.trim();
      const msg = roomMsgPayload.value.trim();
      if (!room || !msg) return;
      
      log('info', 'Sending event \\'sendToRoom\\' targeting "' + room + '" with message: "' + msg + '"');
      socket.emit('sendToRoom', { room, message: msg }, (ack) => {
        log('success', 'Send to room callback response:', ack);
      });
    });

    // Simulate REST broadcast trigger
    triggerRestBtn.addEventListener('click', async () => {
      const type = restTargetType.value;
      const payloadText = restMsgPayload.value.trim();
      
      const requestBody = {
        event: 'notification',
        data: {
          title: 'REST Broadcast Event',
          message: payloadText,
          time: new Date().toLocaleTimeString()
        }
      };
      
      if (type === 'user') {
        const idVal = restTargetId.value.trim();
        if (!idVal) {
          log('error', 'Please enter a target User ID');
          return;
        }
        requestBody.userId = idVal;
      } else if (type === 'room') {
        const idVal = restTargetId.value.trim();
        if (!idVal) {
          log('error', 'Please enter a target Room name');
          return;
        }
        requestBody.room = idVal;
      }
      
      log('info', 'Making HTTP POST request to /websocket-broadcast...', requestBody);
      
      try {
        const response = await fetch('/websocket-broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        const resData = await response.json();
        log('success', 'HTTP POST Response:', resData);
      } catch (err) {
        log('error', 'Failed to execute HTTP POST: ' + err.message);
      }
    });
  </script>
</body>
</html>`;
  }

  @Post('websocket-broadcast')
  @ApiOperation({
    summary: 'Send real-time WebSocket broadcast from HTTP REST',
  })
  broadcast(
    @Body() body: { event: string; data: any; userId?: string; room?: string },
  ) {
    if (body.userId) {
      this.websocketService.sendToUser(body.userId, body.event, body.data);
      return { status: 'success', target: `user:${body.userId}` };
    } else if (body.room) {
      this.websocketService.sendToRoom(body.room, body.event, body.data);
      return { status: 'success', target: `room:${body.room}` };
    } else {
      this.websocketService.sendToAll(body.event, body.data);
      return { status: 'success', target: 'all' };
    }
  }
}
