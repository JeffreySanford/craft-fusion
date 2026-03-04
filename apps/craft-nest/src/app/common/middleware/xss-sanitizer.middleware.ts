import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class XssSanitizerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // very basic strip of angle brackets to avoid simple XSS payloads
        return value.replace(/[<>"'`]/g, '');
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) {
          value[key] = sanitizeValue(value[key]);
        }
      }
      return value;
    };

    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    next();
  }
}
