# NestJS Template Project

Mẫu dự án (Template) xây dựng trên nền tảng [NestJS](https://nestjs.com/) phiên bản mới nhất, được cấu hình sẵn các công cụ, thư viện và kiến trúc tốt nhất để bạn có thể bắt tay ngay vào việc phát triển tính năng.

## 🚀 Tính Năng Tích Hợp (Features)

Template này đã được setup sẵn các module và công cụ sau:

- **Database (PostgreSQL + Prisma):** Quản lý cơ sở dữ liệu mạnh mẽ, có type-safe với Prisma ORM.
- **Caching (Redis):** Tích hợp sẵn `ioredis` (được cấu hình qua `RedisModule` Global) giúp tăng tốc độ ứng dụng và quản lý queue/session.
- **Docker Ready:** Có sẵn `docker-compose.yml` để chạy PostgreSQL và Redis chỉ với một câu lệnh.
- **Phân Quyền (RBAC):** Cung cấp sẵn kiến trúc phân quyền Role-Based Access Control (`Role` enum, `@Roles()` decorator, `RolesGuard`).
- **Git Hooks (Husky + lint-staged):** Tự động format code bằng Prettier và fix lỗi bằng ESLint trước mỗi lần `git commit`.
- **Bộ Utilities Phong Phú:** Có sẵn thư mục `src/common/utils/` chứa các hàm tiện ích cực kỳ phổ biến:
  - `token.util.ts`: Sinh JWT token, Verify JWT, tạo mã OTP, hash mã OTP/Refresh Token.
  - `password.util.ts`: Hash và kiểm tra mật khẩu với `bcrypt`.
  - `string.util.ts`: Xoá dấu tiếng Việt, viết hoa chữ cái đầu, validate Email/SĐT.
  - `date.util.ts`: Thao tác với thời gian (cộng trừ ngày giờ).
  - `array.util.ts`: Group dữ liệu, loại bỏ phần tử trùng lặp.
  - `file.util.ts`: Lấy đuôi file, random tên file để upload an toàn.
  - `crypto.util.ts`: Mã hoá đối xứng AES-256-CBC để lưu trữ các API Key hay cấu hình nhạy cảm.
  - `pagination.util.ts`: Khung phân trang dữ liệu trả về cho client.
  - `slug.util.ts`: Tạo URL thân thiện bằng `slugify`.

## ⚙️ Yêu Cầu Hệ Thống

- Node.js (v20+)
- pnpm (Khuyến nghị sử dụng pnpm để cài package)
- Docker & Docker Compose (để chạy database cục bộ)

## 🛠️ Cài Đặt và Khởi Chạy

### 1. Cài đặt các gói phụ thuộc
```bash
pnpm install
```

### 2. Thiết lập biến môi trường
Mở file `.env` và kiểm tra lại cấu hình. Template đã cung cấp sẵn một file `.env` chuẩn:
```env
PORT=3000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123456
POSTGRES_DB=nestjs_template
DATABASE_URL=postgresql://postgres:123456@localhost:5433/nestjs_template?schema=public

# Redis
REDIS_PORT=6379

# JWT
JWT_SECRET="super-secret-jwt-key-change-me"
JWT_EXPIRES_IN="1d"
```

### 3. Khởi động Database & Redis
Sử dụng Docker để khởi động Postgres và Redis ở chế độ nền:
```bash
docker-compose up -d
```

### 4. Đồng bộ Schema Database
```bash
pnpm exec prisma db push
# hoặc pnpm exec prisma migrate dev
```

### 5. Khởi động ứng dụng NestJS
```bash
# Môi trường phát triển (tự động reload khi có thay đổi)
pnpm run start:dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`.

## 📂 Cấu trúc thư mục

```
src/
├── common/                  # Chứa các thành phần dùng chung toàn cục
│   ├── decorators/          # Custom decorators (vd: @Roles)
│   ├── enums/               # Các enum chuẩn (vd: Role)
│   ├── guards/              # Custom guards (vd: RolesGuard)
│   └── utils/               # Các file tiện ích (Token, String, Crypto,...)
├── config/                  # Cấu hình biến môi trường (env.config.ts)
├── database/                # Modules liên kết CSDL
│   ├── postgre-sql/         # Prisma Module và Service
│   └── redis/               # Redis Module và Service (ioredis)
├── modules/                 # Nơi bạn tạo các domain feature (User, Product,...)
├── app.controller.ts
├── app.module.ts            # Root module
└── main.ts                  # Điểm khởi chạy của ứng dụng
```

## 📝 Script hữu ích

- `pnpm run format`: Format lại toàn bộ code với Prettier.
- `pnpm run lint`: Chạy ESLint để check và tự động sửa lỗi.
- `pnpm run build`: Build project ra thư mục `dist` để chạy Production.

---
*Mẫu dự án này được thiết kế theo nguyên tắc Sạch (Clean) và Dễ bảo trì. Bạn có thể xóa bỏ hoặc thêm bớt các module trong `src` tùy theo nhu cầu thực tế của dự án.*
