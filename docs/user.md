# Tài Liệu Hướng Dẫn Quản Lý Người Dùng (User Management)

Mô-đun quản lý người dùng (`UserModule`) cung cấp đầy đủ các thao tác CRUD cơ bản để truy vấn, cập nhật, tạo mới và xóa bỏ thông tin tài khoản người dùng trong cơ sở dữ liệu PostgreSQL thông qua Prisma ORM.

---

## 1. Cấu Trúc Thành Phần
Hệ thống được thiết kế theo cấu trúc phân tầng (layered architecture) kết hợp Repository Pattern:

*   **[`user.controller.ts`](../src/modules/user/user.controller.ts)**: Tiếp nhận các HTTP Request, xử lý định dạng DTO đầu vào, điều phối luồng và định dạng kết quả trả về.
*   **[`user.service.ts`](../src/modules/user/user.service.ts)**: Chứa các quy tắc nghiệp vụ (Business Logic) như kiểm tra trùng lặp email, xử lý mã hóa mật khẩu khi cập nhật/tạo mới.
*   **[`user.repository.ts`](../src/modules/user/user.repository.ts)**: Trực tiếp gọi Prisma Client để thực thi các câu lệnh truy vấn xuống DB (PostgreSQL). Giúp loại bỏ hoàn toàn sự phụ thuộc trực tiếp của Business Logic vào ORM cụ thể.
*   **[`dto/`](../src/modules/user/dto)**: Chứa các lớp truyền dữ liệu (`CreateUserDto`, `UpdateUserDto`) được định nghĩa kiểu và kiểm tra tính hợp lệ dữ liệu.

---

## 2. Đặc Tả Dữ Liệu Đầu Vào (DTOs & Validation)

Hệ thống sử dụng `class-validator` để kiểm soát dữ liệu đầu vào. Các quy tắc kiểm tra bao gồm:

### 2.1. CreateUserDto
*   `email`: Phải là định dạng Email hợp lệ (`@IsEmail()`).
*   `password`: Chuỗi ký tự, tối thiểu 6 ký tự (`@MinLength(6)`).
*   `name`: Chuỗi ký tự không bắt buộc (`@IsOptional()`, `@IsString()`).
*   `role`: Vai trò người dùng (`USER`, `ADMIN`), không bắt buộc, mặc định là `USER`.

### 2.2. UpdateUserDto
*   Kế thừa toàn bộ các thuộc tính của `CreateUserDto` nhưng tất cả đều là không bắt buộc (`PartialType`).
*   Thêm thuộc tính `isActive` (`boolean`) dùng để khóa hoặc kích hoạt tài khoản.

---

## 3. Đặc Tả API Endpoints

Mặc định các endpoint dưới đây được định nghĩa dưới tiền tố `/users`:

| HTTP Method | Endpoint | Mô tả | Trạng thái Response |
| :--- | :--- | :--- | :--- |
| **POST** | `/users` | Tạo mới tài khoản người dùng. | `201 Created`, `400 Bad Request` (Dữ liệu lỗi), `409 Conflict` (Email trùng) |
| **GET** | `/users` | Lấy danh sách toàn bộ người dùng. | `200 OK` (Trả về một mảng chứa thông tin tất cả users) |
| **GET** | `/users/:id` | Xem chi tiết thông tin một người dùng theo UUID. | `200 OK`, `404 Not Found` |
| **PATCH** | `/users/:id` | Cập nhật thông tin người dùng theo UUID. | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/users/:id` | Xóa vĩnh viễn tài khoản người dùng theo UUID. | `200 OK`, `404 Not Found` |

### Ví dụ cập nhật người dùng (PATCH):
*   **Endpoint:** `PATCH /users/d290f1ee-6c54-4b01-90e6-d701748f0851`
*   **Request Body (JSON):**
    ```json
    {
      "name": "Nguyen Van B",
      "isActive": false
    }
    ```
*   **Response (JSON):**
    ```json
    {
      "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "email": "user@example.com",
      "name": "Nguyen Van B",
      "role": "USER",
      "isActive": false,
      "createdAt": "2026-07-18T00:00:00.000Z",
      "updatedAt": "2026-07-18T01:15:00.000Z"
    }
    ```
