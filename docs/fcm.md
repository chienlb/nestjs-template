# Tài Liệu Hướng Dẫn Thông Báo Đẩy (Firebase Cloud Messaging - FCM)

Hệ thống thông báo đẩy (Push Notification) trong dự án NestJS Template được tích hợp sẵn với dịch vụ **Firebase Cloud Messaging (FCM)** thông qua thư viện chính thức `firebase-admin`. Hệ thống hỗ trợ đăng ký thiết bị của người dùng, tự động điều phối gửi tin nhắn đẩy và ghi nhật ký hoạt động (Audit Logs) cho mỗi tiến trình.

---

## 1. Cấu Trúc Các Thành Phần
*   **[`fcm.controller.ts`](../src/modules/fcm/fcm.controller.ts)**: Cung cấp HTTP API cho phép client đăng ký token thiết bị (`POST /devices/register`) và trigger gửi thông báo đẩy (`POST /notifications/send`).
*   **[`fcm.service.ts`](../src/modules/fcm/fcm.service.ts)**: Quản lý vòng đời khởi tạo Firebase Admin SDK, xử lý việc thêm/xóa Token thiết bị trong cơ sở dữ liệu (thông qua Prisma), gửi thông báo tới thiết bị và hỗ trợ cơ chế giả lập (**Mock Mode**) khi chưa cấu hình Firebase.

---

## 2. Cấu Hình Environment Variables (.env)
Để kích hoạt kết nối thực tới dịch vụ Firebase, bạn cần khai báo các biến môi trường sau trong `.env`:

```env
# Firebase Cloud Messaging Credentials
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
```

### Cơ chế Giả lập (Mock Mode)
Nếu thiếu cấu hình Firebase hoặc cấu hình không hợp lệ, hệ thống sẽ **tự động chuyển sang chế độ Mock Mode** thay vì làm sập ứng dụng. Ở chế độ này:
- Quá trình đăng ký và xóa token vẫn hoạt động trên DB.
- Các yêu cầu gửi thông báo đẩy sẽ không thực sự gửi tới Google, thay vào đó sẽ in thông tin ra cửa sổ log và ghi nhận thành công trong `AuditLog` với cờ `mock: true`.

---

## 3. Đặc Tả REST API Endpoints

### 3.1. Đăng Ký Token Thiết Bị
Khi người dùng đăng nhập hoặc cấp quyền nhận thông báo trên ứng dụng (Mobile/Web), Client cần gửi Token FCM lên Server để lưu trữ.

*   **Endpoint:** `POST /devices/register`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Request Body (JSON):**
    ```json
    {
      "token": "fcm-device-registration-token-xyz",
      "deviceType": "android" 
    }
    ```
    *(Thuộc tính `deviceType` có giá trị tùy ý như: `android`, `ios`, `web`)*
*   **Cơ chế lưu trữ:** Sử dụng kỹ thuật `Prisma.upsert` trên bảng `user_devices` theo giá trị độc nhất `token`. Nếu token đã được đăng ký cho user khác trước đó, nó sẽ tự động được chuyển nhượng sang User ID hiện tại để tránh trùng lặp. Đồng thời ghi nhận log `REGISTER_DEVICE_TOKEN`.

### 3.2. Gửi Thông Báo Đẩy Cho Người Dùng
Gửi thông báo đẩy tới toàn bộ thiết bị đang hoạt động của một người dùng cụ thể.

*   **Endpoint:** `POST /notifications/send`
*   **Headers:**
    ```http
    Authorization: Bearer <accessToken>
    ```
*   **Request Body (JSON):**
    ```json
    {
      "targetUserId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "title": "Bạn có tin nhắn mới",
      "body": "Nguyen Van A đã bình luận về bài viết của bạn.",
      "data": {
        "click_action": "FLUTTER_NOTIFICATION_CLICK",
        "postId": "12345"
      }
    }
    ```
*   **Luồng hoạt động ở Service:**
    1.  Tìm kiếm danh sách thiết bị trong bảng `user_devices` tương ứng với `targetUserId`.
    2.  Nếu tìm thấy, hệ thống sẽ thực hiện gửi thông báo tới tất cả các thiết bị song song (`Promise.all`).
    3.  Mỗi tiến trình gửi thành công/thất bại cho từng thiết bị đều sẽ được ghi nhận vào nhật ký hệ thống `AuditLog` để tiện truy vết lỗi sau này.
