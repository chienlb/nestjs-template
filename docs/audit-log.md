# Tài Liệu Hướng Dẫn Nhật Ký Hoạt Động Hệ Thống (Audit Logs)

Mô-đun nhật ký hoạt động (`AuditLogModule`) giúp ghi lại mọi hành vi nhạy cảm hoặc quan trọng của người dùng và hệ thống (ví dụ: đăng nhập, đăng ký token thiết bị, gửi thông báo đẩy, thay đổi dữ liệu) vào cơ sở dữ liệu để phục vụ công tác giám sát, bảo mật và khắc phục sự cố.

---

## 1. Cấu Trúc Thành Phần
Hệ thống sử dụng mô hình Repository Pattern tách biệt để xử lý lưu trữ:
*   **[`audit-log.service.ts`](../src/modules/audit-log/audit-log.service.ts)**: Cung cấp API nội bộ cho các service khác gọi để ghi nhận nhật ký hoạt động.
*   **[`audit-log.repository.ts`](../src/modules/audit-log/audit-log.repository.ts)**: Thực thi truy vấn Prisma Client ghi dữ liệu xuống bảng `audit_logs` trong PostgreSQL, tự động nạp liên kết (relation) với thông tin người dùng thực hiện hành động.

---

## 2. Mô Hình Dữ Liệu AuditLog (Prisma Schema)

Nhật ký hoạt động lưu trữ các trường dữ liệu sau:
*   `id`: UUID khóa chính tự động tạo.
*   `userId` (Không bắt buộc): Liên kết tới bảng `users` (nếu hành động do khách vãng lai/anonymous thực hiện, trường này sẽ có giá trị `null`).
*   `action`: Chuỗi ký tự định nghĩa loại hành động (ví dụ: `REGISTER_DEVICE_TOKEN`, `API_TRIGGERED_NOTIFICATION`).
*   `details`: Dữ liệu JSON lưu trữ động các thông số đi kèm hành động (ví dụ: gửi thông báo thì lưu tiêu đề, nội dung, cờ thành công).
*   `ipAddress` (Không bắt buộc): Lưu IP của client thực hiện request.
*   `userAgent` (Không bắt buộc): Lưu thông tin thiết bị/trình duyệt của client.
*   `createdAt`: Thời gian ghi nhận log.

---

## 3. Cách Ghi Log Nội Bộ (Backend Logging)

`AuditLogService` được thiết kế để dễ dàng tiêm vào các service khác. Để ghi log, bạn gọi phương thức `log`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AccountService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async changePassword(userId: string, reqIp: string, userAgent: string) {
    // 1. Thực hiện đổi mật khẩu...
    
    // 2. Ghi nhận log bảo mật
    void this.auditLogService.log(
      userId,
      'USER_CHANGE_PASSWORD',
      { status: 'success' },
      { ipAddress: reqIp, userAgent }
    );
  }
}
```

### Giải thích tham số hàm `log()`:
```typescript
async log(
  userId: string | null,
  action: string,
  details: Record<string, unknown>,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<AuditLog>
```

---

## 4. Truy Vấn Nhật Ký Hoạt Động qua API

Mặc dù `AuditLogService` không có controller riêng, nhưng các REST endpoint quản trị để truy xuất logs được tích hợp trong **`FcmController`** dưới route:

*   **Endpoint:** `GET /audit-logs`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Query Parameters:**
    *   `limit` (number, Không bắt buộc, mặc định: `100`): Giới hạn số lượng bản ghi logs gần nhất cần lấy ra.
*   **Response (JSON):** Trả về mảng danh sách logs sắp xếp theo thời gian mới nhất trước (`createdAt: desc`), kèm theo thông tin hiển thị cơ bản của người dùng (`id`, `email`, `name`).

### Ví dụ Response mẫu:
```json
[
  {
    "id": "e4299b92-747d-4171-8bbf-856c4d7ec660",
    "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "action": "API_TRIGGERED_NOTIFICATION",
    "details": {
      "body": "Đây là thông báo từ hệ thống",
      "data": {},
      "success": true,
      "title": "Chào Bạn",
      "targetUserId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
    },
    "ipAddress": "::1",
    "userAgent": "PostmanRuntime/7.40.0",
    "createdAt": "2026-07-18T01:09:27.914Z",
    "user": {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "baochien2602@gmail.com",
      "name": "La Bao Chien"
    }
  }
]
```
