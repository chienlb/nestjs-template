import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only sanitize HTTP request body payloads
    if (metadata.type !== 'body' || !value) {
      return value;
    }

    return this.sanitizeObject(value);
  }

  /**
   * Recursively sanitizes string inputs within arrays or nested objects
   */
  private sanitizeObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return xss.filterXSS(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item: unknown) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitizedObj: Record<string, unknown> = {};
      const record = obj as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        sanitizedObj[key] = this.sanitizeObject(record[key]);
      }
      return sanitizedObj;
    }

    return obj;
  }
}
