# Tài Liệu Hướng Dẫn Xác Thực & Phân Quyền (Authentication & RBAC)

Hệ thống xác thực trong dự án NestJS Template được phát triển dựa trên **JSON Web Tokens (JWT)**. Hệ thống cung cấp các luồng đăng ký tài khoản, đăng nhập, lấy thông tin cá nhân và phân quyền truy cập nâng cao sử dụng Decorators và Guards.

---

## 1. Các File Cốt Lõi của Hệ Thống
*   **[`auth.controller.ts`](../src/modules/auth/auth.controller.ts)**: Định nghĩa các endpoint REST API cho đăng ký, đăng nhập và thông tin cá nhân.
*   **[`auth.service.ts`](../src/modules/auth/auth.service.ts)**: Xử lý logic nghiệp vụ mã hóa/so sánh mật khẩu, tạo token JWT.
*   **[`auth.guard.ts`](../src/common/guards/auth.guard.ts)**: Guard kiểm tra tính hợp lệ của token JWT gửi lên từ client.
*   **[`roles.guard.ts`](../src/common/guards/roles.guard.ts)**: Guard kiểm tra vai trò người dùng (RBAC) để chặn truy cập tài nguyên.
*   **[`roles.decorator.ts`](../src/common/decorators/roles.decorator.ts)**: Metadata decorator dùng để khai báo vai trò cần thiết cho một route.

---

## 2. API Endpoints Đặc Tả

### 2.1. Đăng Ký Tài Khoản (Register)
Đăng ký một người dùng mới vào cơ sở dữ liệu. Mật khẩu được băm tự động bằng `bcrypt` thông qua helper `password.util.ts`.

*   **Endpoint:** `POST /auth/register`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123",
      "name": "Nguyen Van A"
    }
    ```
*   **Response (JSON):** Trả về thông tin người dùng được tạo mới (mật khẩu đã bị ẩn).
    ```json
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "email": "user@example.com",
      "name": "Nguyen Van A",
      "role": "USER",
      "isActive": true,
      "createdAt": "2026-07-18T00:00:00.000Z"
    }
    ```

### 2.2. Đăng Nhập (Login)
Xác minh thông tin email/mật khẩu và trả về mã truy cập JWT.

*   **Endpoint:** `POST /auth/login`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "email": "user@example.com",
        "role": "USER"
      }
    }
    ```

### 2.3. Lấy Thông Tin Cá Nhân (Profile - me)
Lấy thông tin chi tiết của tài khoản đang kết nối. Yêu cầu truyền kèm JWT Token ở Header.

*   **Endpoint:** `GET /auth/me`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Response (JSON):** Trả về đầy đủ thông tin tài khoản của user tương ứng với token gửi lên.

### 2.4. Gửi mã OTP khôi phục mật khẩu (Send OTP)
Tạo mã OTP ngẫu nhiên gồm 6 chữ số, lưu trữ vào Redis (hết hạn sau 5 phút) và gửi tới email của người dùng.

*   **Endpoint:** `POST /auth/send-otp`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "message": "Mã OTP đã được gửi đến email của bạn"
    }
    ```

### 2.5. Đặt lại mật khẩu (Reset Password)
Đặt lại mật khẩu mới cho người dùng sau khi đã xác minh mã OTP hợp lệ gửi qua email.

*   **Endpoint:** `POST /auth/reset-password`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "otp": "123456",
      "newPassword": "newsecurepassword123"
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "message": "Mật khẩu đã được đặt lại thành công"
    }
    ```

### 2.6. Thay đổi mật khẩu (Change Password)
Thay đổi mật khẩu cho người dùng hiện tại đang đăng nhập. Yêu cầu truyền kèm JWT Token ở Header.

*   **Endpoint:** `POST /auth/change-password`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Request Body (JSON):**
    ```json
    {
      "oldPassword": "strongpassword123",
      "newPassword": "newsecurepassword123"
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "message": "Mật khẩu đã được thay đổi thành công"
    }
    ```

### 2.7. Đăng xuất (Logout)
Đăng xuất người dùng ra khỏi hệ thống, đồng thời hủy liên kết đăng ký Token FCM (nhận thông báo đẩy) của thiết bị nếu được truyền lên. Yêu cầu truyền kèm JWT Token ở Header.

*   **Endpoint:** `POST /auth/logout`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Request Body (JSON - Không bắt buộc):**
    ```json
    {
      "deviceToken": "fcm-device-token-to-delete"
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "message": "Đăng xuất thành công"
    }
    ```

### 2.8. Lấy hồ sơ tài khoản (Profile)
Đường dẫn rút gọn để lấy thông tin hồ sơ của tài khoản đang đăng nhập. Yêu cầu truyền kèm JWT Token ở Header.

*   **Endpoint:** `GET /auth/profile`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Response (JSON):** Trả về thông tin hồ sơ người dùng (đã ẩn trường mật khẩu).

---

## 3. Cơ Chế Phân Quyền Vai Trò (Role-Based Access Control)

Dự án cung cấp cơ chế phân quyền dựa trên thuộc tính `role` của người dùng (mặc định: `USER`, `ADMIN`).

### 3.1. Phân quyền trên Route
Để giới hạn truy cập cho một Endpoint chỉ cho phép `ADMIN` truy cập, bạn sử dụng decorator `@Roles()` cùng hai guard `JwtAuthGuard` và `RolesGuard` phối hợp:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng cả 2 Guard
export class AdminController {
  
  @Get('dashboard')
  @Roles(Role.ADMIN) // Chỉ người dùng có role ADMIN mới vào được
  getDashboard() {
    return { message: 'Chào mừng Admin quay trở lại!' };
  }
}
```

### 3.2. Cấu trúc hoạt động
1.  **`JwtAuthGuard`**: Giải mã JWT, tìm thấy thuộc tính `role` và gán thông tin payload vào `request.user`.
2.  **`RolesGuard`**: So sánh danh sách `role` được chỉ định thông qua decorator `@Roles()` với `request.user.role`. Nếu khớp, cho phép truy cập. Nếu không, trả về lỗi `403 Forbidden`.
