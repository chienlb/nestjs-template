# Tài Liệu Hướng Dẫn Tải Lên Tập Tin (File Upload Cloudflare R2 / S3)

Hệ thống lưu trữ và tải lên tập tin trong dự án NestJS Template được tích hợp sẵn với dịch vụ **Cloudflare R2** (hoặc bất kỳ dịch vụ lưu trữ nào tương thích với chuẩn **Amazon S3 API**) thông qua thư viện `@aws-sdk/client-s3`.

---

## 1. Cấu Trúc Các Thành Phần
*   **[`upload.controller.ts`](../src/modules/upload/upload.controller.ts)**: Cung cấp HTTP API cho client tải lên tập tin, sử dụng Multer `FileInterceptor` để đón dữ liệu Multipart.
*   **[`upload.service.ts`](../src/modules/upload/upload.service.ts)**: Khởi tạo kết nối tới Cloudflare R2 endpoint, thực thi tải tập tin lên bucket, tự động đổi tên tập tin và kiểm tra trạng thái lưu trữ (Health Check).

---

## 2. Cấu Hình Environment Variables (.env)
Để tính năng tải lên hoạt động, bạn cần cấu hình các thông số lưu trữ sau trong `.env`:

```env
# Cloudflare R2 / AWS S3 Configs
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET="your-bucket-name"
R2_PUBLIC_BASE="https://pub-xxxxxx.r2.dev" # URL công khai của bucket để truy cập file
```

---

## 3. Đặc Tả REST API Upload

API cho phép tải lên một tập tin đơn lẻ cùng với việc phân thư mục tùy chọn.

*   **Endpoint:** `POST /upload`
*   **Content-Type:** `multipart/form-data`
*   **Body Parameters:**
    *   `file` (binary, Bắt buộc): Tập tin cần tải lên.
    *   `folder` (string, Không bắt buộc, mặc định: `"uploads"`): Tên thư mục muốn lưu trữ tập tin trong bucket.
*   **Cơ chế đổi tên tập tin:** Để tránh xung đột tên và đảm bảo bảo mật, tên tập tin sẽ được thay thế bằng một chuỗi **UUID** ngẫu nhiên được tạo tự động thông qua `crypto.randomUUID()`, đồng thời vẫn giữ lại đuôi mở rộng gốc (ví dụ: `uploads/c8a9f6e3-54bf-42d1-81f1-e374d9ab9efb.png`).

### Ví dụ Response thành công (201 Created):
```json
{
  "message": "File uploaded successfully",
  "data": {
    "url": "https://pub-xxxxxx.r2.dev/uploads/c8a9f6e3-54bf-42d1-81f1-e374d9ab9efb.png",
    "key": "uploads/c8a9f6e3-54bf-42d1-81f1-e374d9ab9efb.png"
  }
}
```

---

## 4. Kiểm Tra Sức Khỏe Lưu Trữ (Health Check)
Mô-đun này cung cấp phương thức `checkHealth()` nội bộ để kiểm tra khả năng kết nối tới R2 Bucket. Phương thức này sử dụng `HeadBucketCommand` gửi một yêu cầu truy vấn thông tin meta của bucket:
*   Nếu kết nối thành công, trả về trạng thái `{ status: 'up' }`.
*   Nếu thông tin cấu hình trong `.env` trống, trả về `{ status: 'unconfigured' }` (không gây lỗi cho ứng dụng).
*   Nếu có lỗi kết nối (sai Access Key, sai Bucket), trả về `{ status: 'down', error: '...' }`.
