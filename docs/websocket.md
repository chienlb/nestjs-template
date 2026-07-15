# Tài Liệu Hướng Dẫn Tích Hợp & Sử Dụng WebSockets

Hệ thống WebSocket trong NestJS Template được xây dựng trên nền tảng **Socket.io** (sử dụng thư viện `@nestjs/websockets` và `@nestjs/platform-socket.io`). Tích hợp sẵn cơ chế xử lý CORS đồng bộ với HTTP API, xác thực người dùng bằng JWT, phân chia phòng (Room), và dịch vụ phát sóng sự kiện (Broadcast Service) toàn cục.

---

## 1. Cấu Trúc Thư Mục & Các File Đã Thêm

Hệ thống WebSocket bao gồm các thành phần cốt lõi sau:

*   **[`socket-io.adapter.ts`](../src/common/adapters/socket-io.adapter.ts)**: Adapter tùy chỉnh kế thừa từ `IoAdapter` của NestJS, đồng bộ hóa cấu hình CORS giữa REST API (`ConfigService`) và WebSocket server.
*   **[`websocket.gateway.ts`](../src/modules/websocket/websocket.gateway.ts)**: Cổng giao tiếp chính lắng nghe kết nối, xử lý sự kiện kết nối/ngắt kết nối, xác thực token JWT, và phân luồng sự kiện (`message`, `joinRoom`, `leaveRoom`, `sendToRoom`).
*   **[`websocket.service.ts`](../src/modules/websocket/websocket.service.ts)**: Dịch vụ toàn cục giúp gửi tin nhắn real-time tới client từ bất kỳ controller hoặc service nào khác trong dự án.
*   **[`websocket.module.ts`](../src/modules/websocket/websocket.module.ts)**: Đóng gói và xuất khẩu `WebsocketService` với thuộc tính `@Global()`.

---

## 2. Luồng Xác Thực Kết Nối (Authentication)

Khi client kết nối tới WebSocket Server, hệ thống sẽ cố gắng giải mã token JWT để xác minh danh tính người dùng. Hệ thống hỗ trợ lấy token từ 3 nguồn:

1.  **Auth Payload** (Khuyên dùng cho Client): Gửi qua thuộc tính `auth.token`.
2.  **HTTP Headers**: Gửi qua header `Authorization: Bearer <token>`.
3.  **Query Parameter**: Gửi qua chuỗi truy vấn `?token=<token>`.

### Cơ chế gán phòng cá nhân (Personal Room)
Nếu token hợp lệ, hệ thống sẽ:
- Giải mã và lưu thông tin người dùng vào thuộc tính `client.user`.
- Cho client tự động gia nhập vào một phòng có tên là `user:<userId>`. Điều này giúp việc gửi thông báo riêng tới một người dùng cực kỳ đơn giản (dù họ đang mở bao nhiêu tab hay thiết bị).

*Lưu ý (Để Debug): Hệ thống cho phép truyền `?userId=mock_user_123` trên query string để kiểm tra tính năng mà không cần tạo thật JWT.*

---

## 3. Cách Sử Dụng tại Backend

`WebsocketService` được đăng ký làm service toàn cục (`@Global()`). Bạn chỉ cần tiêm (`inject`) nó vào constructor của bất kỳ service/controller nào để gửi tin nhắn real-time:

### Các phương thức hỗ trợ:

| Phương thức | Tham số | Mô tả |
| :--- | :--- | :--- |
| `sendToAll(event, data)` | `event: string`, `data: any` | Phát tin nhắn cho **tất cả** các client đang kết nối. |
| `sendToUser(userId, event, data)` | `userId: string`, `event: string`, `data: any` | Gửi tin nhắn tới **riêng một người dùng** cụ thể. |
| `sendToRoom(room, event, data)` | `room: string`, `event: string`, `data: any` | Gửi tin nhắn cho tất cả thành viên trong **phòng** cụ thể. |

### Ví dụ thực tế:
```typescript
import { Injectable } from '@nestjs/common';
import { WebsocketService } from '../websocket/websocket.service';

@Injectable()
export class NotificationService {
  constructor(private readonly wsService: WebsocketService) {}

  // Gửi thông báo khi có người bình luận vào bài viết
  async notifyNewComment(authorId: string, postId: string, commentContent: string) {
    // Gửi thông báo tới phòng của bài viết đó (cho tất cả những người đang xem bài viết)
    this.wsService.sendToRoom(`post:${postId}`, 'newComment', {
      authorId,
      content: commentContent,
    });
    
    // Gửi thông báo riêng tới tác giả bài viết
    const postOwnerId = 'user_abc';
    this.wsService.sendToUser(postOwnerId, 'notification', {
      title: 'Bình luận mới',
      message: 'Có người vừa bình luận về bài viết của bạn!',
    });
  }
}
```

---

## 4. Cách Tích Hợp ở Frontend (Client Integration)

Để kết nối tới WebSocket Server từ phía client, bạn cần cài đặt thư viện `socket.io-client`:

```bash
npm install socket.io-client
```

### Mã nguồn mẫu kết nối:

```javascript
import { io } from 'socket.io-client';

const token = 'YOUR_JWT_TOKEN'; // Token JWT của người dùng sau khi đăng nhập

// 1. Khởi tạo kết nối với token xác thực
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: {
    token: token
  }
});

// 2. Lắng nghe các sự kiện kết nối/ngắt kết nối
socket.on('connect', () => {
  console.log('Đã kết nối thành công! Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Mất kết nối:', reason);
});

// 3. Lắng nghe sự kiện từ Server gửi xuống
socket.on('notification', (data) => {
  console.log('Nhận thông báo mới:', data);
});

socket.on('roomMessage', (data) => {
  console.log('Tin nhắn mới trong phòng ' + data.room + ':', data.message);
});

// 4. Gửi sự kiện lên Server
// Gửi tin nhắn chat thông thường
socket.emit('message', 'Hello World!');

// Tham gia vào phòng chat cụ thể
socket.emit('joinRoom', 'room-marketing');

// Gửi tin nhắn vào phòng chat
socket.emit('sendToRoom', {
  room: 'room-marketing',
  message: 'Chào mọi người trong phòng Marketing!'
});
```

---

## 5. Chạy Thử Nghiệm Qua Giao Diện Visual Debugger

Chúng tôi đã xây dựng sẵn giao diện trực quan phục vụ việc test nhanh các chức năng WebSocket tại:
👉 **[http://localhost:3000/websocket-demo](http://localhost:3000/websocket-demo)**

### Các chức năng trên Dashboard:
1.  **Cấu hình kết nối (Connection Configuration)**: Cấu hình địa chỉ WebSocket, tùy chọn nhập Mock User ID hoặc JWT Token để test cơ chế phân quyền.
2.  **Gửi Message**: Gửi event tên là `message` lên server và nhận phản hồi trực tiếp.
3.  **Quản lý phòng (Room Management)**: Join/Leave phòng, gửi tin nhắn tới riêng phòng vừa gia nhập.
4.  **Giả lập Broadcast từ REST API**: Cho phép nhập thông tin (All, User ID, Room), nội dung thông báo rồi kích hoạt cuộc gọi API POST `/websocket-broadcast` tới NestJS Server. Server sau đó sẽ sử dụng `WebsocketService` để đẩy sự kiện real-time xuống client tương ứng.

---

## 6. Hướng Dẫn Mở Rộng: Scale Ngang Với Redis (Production)

Trong môi trường production, nếu bạn chạy nhiều instance của NestJS đứng sau một Load Balancer, các client kết nối tới instance A sẽ không nhận được sự kiện nếu server gửi sự kiện từ instance B.

Để giải quyết vấn đề này, bạn cần cài đặt **Redis Adapter** cho Socket.io.

### Các bước cấu hình:

1.  Cài đặt các gói hỗ trợ:
    ```bash
    pnpm add @socket.io/redis-adapter
    ```
2.  Cập nhật file `src/common/adapters/socket-io.adapter.ts`:
    ```typescript
    import { IoAdapter } from '@nestjs/platform-socket.io';
    import { ServerOptions } from 'socket.io';
    import { createAdapter } from '@socket.io/redis-adapter';
    import { Redis } from 'ioredis';
    import { INestApplicationContext } from '@nestjs/common';
    import { ConfigService } from '@nestjs/config';

    export class SocketIoAdapter extends IoAdapter {
      private adapterConstructor: ReturnType<typeof createAdapter>;

      constructor(private app: INestApplicationContext) {
        super(app);
      }

      async connectToRedis(): Promise<void> {
        const configService = this.app.get(ConfigService);
        const host = configService.get<string>('redis.host') || 'localhost';
        const port = configService.get<number>('redis.port') || 6379;

        const pubClient = new Redis({ host, port });
        const subClient = pubClient.duplicate();

        // Đợi kết nối thành công
        await Promise.all([pubClient.connect(), subClient.connect()]);
        
        this.adapterConstructor = createAdapter(pubClient, subClient);
      }

      createIOServer(port: number, options?: ServerOptions): any {
        const configService = this.app.get(ConfigService);
        const corsOrigins = configService.get<string[]>('security.corsOrigins') || ['*'];

        const corsOptions = {
          origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? '*' : corsOrigins,
          methods: ['GET', 'POST'],
          credentials: true,
        };

        const optionsWithCors: any = {
          ...options,
          cors: corsOptions,
        };

        if (this.adapterConstructor) {
          optionsWithCors.adapter = this.adapterConstructor;
        }

        return super.createIOServer(port, optionsWithCors);
      }
    }
    ```
3.  Cập nhật hàm `bootstrap` trong `src/main.ts` để gọi `connectToRedis` trước khi đăng ký adapter:
    ```typescript
    const redisIoAdapter = new SocketIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    ```
