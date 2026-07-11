import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<{ statusCode: number }>();
    return next.handle().pipe(
      map((data: unknown) => {
        const isObject = typeof data === 'object' && data !== null;
        const message =
          isObject && 'message' in data
            ? (data as Record<string, unknown>).message
            : 'Success';
        const innerData =
          isObject &&
          'data' in data &&
          (data as Record<string, unknown>).data !== undefined
            ? (data as Record<string, unknown>).data
            : data;

        return {
          success: true,
          statusCode: response.statusCode,
          message: typeof message === 'string' ? message : 'Success',
          data: innerData as T,
        };
      }),
    );
  }
}
