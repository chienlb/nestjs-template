import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest<Request>();

    // Lấy IP của client. Nếu app chạy sau proxy/load balancer thì ưu tiên x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip;

    // Danh sách IP được ưu tiên (không bị rate limit)
    // Thực tế bạn có thể đọc từ ConfigService (process.env.WHITELIST_IPS)
    const whitelist = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

    if (clientIp && whitelist.includes(clientIp)) {
      // Trả về true để bỏ qua việc đếm request và chặn
      return true;
    }

    // Nếu không nằm trong whitelist thì chạy logic Rate Limit mặc định
    return super.handleRequest(requestProps);
  }
}
