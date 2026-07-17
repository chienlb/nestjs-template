# Tài Liệu Hướng Dẫn Gửi Email (Mail Service)

Dự án cung cấp mô-đun gửi email (`MailModule`) được xây dựng trên thư viện **Nodemailer**. Hệ thống cho phép cấu hình và gửi email giao dịch, email thông báo (HTML/Text) thông qua giao thức SMTP.

---

## 1. Cấu Trúc Các Thành Phần
*   **[`mail.service.ts`](../src/modules/mail/mail.service.ts)**: Dịch vụ đảm nhận khởi tạo Nodemailer Transporter, tự động nạp cấu hình và cung cấp phương thức gửi mail chung `sendMail`.
*   **[`mail.module.ts`](../src/modules/mail/mail.module.ts)**: Khai báo dịch vụ để tiêm vào các mô-đun khác khi cần sử dụng.
*   **[`test-mail.ts`](../scripts/test-mail.ts)**: Script kiểm tra tích hợp chạy độc lập giúp nhà phát triển nhanh chóng thử nghiệm tính năng SMTP mà không cần gọi qua API của ứng dụng.

---

## 2. Cấu Hình SMTP (.env)

Hệ thống tự động nạp cấu hình SMTP từ các biến môi trường sau trong `.env`:

```env
# Mail SMTP Configs
EMAIL_USER="baochien2602@gmail.com" # Tài khoản email gửi
EMAIL_PASS="ittm rkuw jndg ijzo"     # Mật khẩu ứng dụng (App Password) hoặc mật khẩu thật
MAIL_PORT=587                       # Cổng SMTP (587 cho TLS/STARTTLS, 465 cho SSL)
MAIL_HOST="smtp.gmail.com"          # Host của nhà cung cấp SMTP (ví dụ: smtp.gmail.com)
MAIL_FROM="\"NestJS Template\" <baochien2602@gmail.com>" # Tên hiển thị người gửi mặc định
```

---

## 3. Cách Sử Dụng tại Backend

Để gửi email từ một service hoặc controller khác, bạn thực hiện tiêm `MailService` và gọi hàm `sendMail`:

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class WelcomeService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(recipientEmail: string, userName: string) {
    await this.mailService.sendMail({
      to: recipientEmail,
      subject: 'Chào Mừng Bạn Đến Với Hệ Thống!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Xin chào ${userName},</h2>
          <p>Tài khoản của bạn đã được đăng ký thành công trên hệ thống của chúng tôi.</p>
          <a href="https://example.com/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Đăng Nhập Ngay
          </a>
        </div>
      `,
    });
  }
}
```

### Tham số đầu vào:
Phương thức `sendMail` chấp nhận tham số kiểu `nodemailer.SendMailOptions`, cho phép tùy chỉnh cao:
- `to`: Người nhận (chuỗi ký tự email hoặc mảng các email).
- `subject`: Tiêu đề email.
- `html`: Nội dung định dạng HTML.
- `text`: Nội dung dạng văn bản thuần túy (dự phòng khi client không render được HTML).
- `attachments`: Mảng các tập tin đính kèm (hỗ trợ đọc từ buffer, file path, hoặc remote URL).

---

## 4. Kiểm Tra Tích Hợp (Integration Script)
Để chạy thử dịch vụ gửi email nhanh chóng và kiểm tra xem thông số cấu hình SMTP trong `.env` đã chính xác chưa, bạn chạy lệnh sau trên terminal:

```bash
pnpm run test:mail <email_nhan>
# Ví dụ:
pnpm run test:mail target-email@example.com
```

**Mô tả hoạt động:** Script sẽ khởi động ứng dụng NestJS ở chế độ Standalone Context, nạp cấu hình và thực thi gửi email kiểm tra tới địa chỉ đích. Cửa sổ terminal sẽ hiển thị ID email được tạo hoặc báo lỗi chi tiết nếu SMTP bị từ chối kết nối.
