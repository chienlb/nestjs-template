# Tài Liệu Hướng Dẫn Kiểm Tra Sức Khỏe Hệ Thống (Health Checks)

Hệ thống cung cấp một Endpoint giám sát sức khỏe toàn diện (`GET /health`) giúp các dịch vụ bên ngoài (như Kubernetes Liveness/Readiness probes, AWS Route53, hoặc UptimeRobot) giám sát trạng thái thời gian thực của ứng dụng.

---

## 1. Cấu Trúc Các Thành Phần
*   **[`health.controller.ts`](../src/modules/health/health.controller.ts)**: Định nghĩa Endpoint API `/health`, tiếp nhận phản hồi từ service và phân phối mã HTTP Status phù hợp (`200 OK` hoặc `503 Service Unavailable`).
*   **[`health.service.ts`](../src/modules/health/health.service.ts)**: Thực thi kiểm tra bất đồng bộ song song trên các hạ tầng dịch vụ cốt lõi: PostgreSQL (Prisma), Redis, và Cloudflare R2 Storage (Upload).

---

## 2. Đặc Tả API Endpoint

*   **Endpoint:** `GET /health`
*   **Mô tả:** Kiểm tra trạng thái của các dịch vụ bên dưới.
*   **Mã phản hồi HTTP Status:**
    -   **`200 OK`**: Khi hệ thống hoạt động bình thường (`healthy`) hoặc hoạt động ở chế độ giảm hiệu năng (`degraded`).
    -   **`503 Service Unavailable`**: Khi ít nhất một trong các dịch vụ cốt lõi (Cơ sở dữ liệu hoặc Redis) bị sập (`unhealthy`).

---

## 3. Luồng Kiểm Tra Chi Tiết (Health Probes)

Khi có request gửi đến `/health`, `HealthService` sẽ thực thi 3 tiến trình song song:

1.  **Cơ sở dữ liệu (PostgreSQL)**: Gửi câu lệnh SQL đơn giản `SELECT 1` thông qua Prisma Client. Nếu truy vấn thành công, trả về trạng thái `"healthy"`. Ngược lại là `"unhealthy"`.
2.  **Bộ nhớ Cache (Redis)**: Gửi lệnh `PING` thông qua thư viện `ioredis`. Nếu nhận phản hồi `PONG`, trả về trạng thái `"healthy"`. Ngược lại là `"unhealthy"`.
3.  **Lưu trữ đám mây (Cloudflare R2)**: Kiểm tra thông qua `HeadBucketCommand` của AWS S3 SDK.
    -   Nếu kết nối thành công: `"healthy"`.
    -   Nếu chưa cấu hình thông số R2 trong `.env`: Trạng thái vẫn là `"healthy"` (để không làm gián đoạn chạy ứng dụng cục bộ khi phát triển).
    -   Nếu cấu hình sai / lỗi kết nối: `"unhealthy"`.

---

## 4. Định Dạng Phản Hồi (Response Payloads)

### 4.1. Hệ thống Khỏe Mạnh (Healthy - 200 OK)
```json
{
  "status": "healthy",
  "details": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "storage": { "status": "healthy" }
  }
}
```

### 4.2. Hệ thống lỗi một phần (Degraded - 200 OK)
Trường hợp PostgreSQL và Redis vẫn kết nối bình thường, nhưng kết nối tới Cloudflare R2 Storage bị lỗi. Hệ thống vẫn phản hồi 200 nhưng trạng thái tổng là `degraded`:
```json
{
  "status": "degraded",
  "details": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "storage": { 
      "status": "unhealthy",
      "error": "Access Denied (Status Code: 403)" 
    }
  }
}
```

### 4.3. Hệ thống ngừng hoạt động (Unhealthy - 503 Service Unavailable)
Trường hợp Cơ sở dữ liệu hoặc Redis bị sập kết nối:
```json
{
  "status": "unhealthy",
  "details": {
    "database": { 
      "status": "unhealthy",
      "error": "Connection refused at 127.0.0.1:5433" 
    },
    "redis": { "status": "healthy" },
    "storage": { "status": "healthy" }
  }
}
```
