import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Provider } from '@angular/core';
import { LoggingHttpInterceptor } from './logging.interceptor';
import { BusyHttpInterceptor } from './busy.interceptor';
import { ReadOnlyInterceptor } from './readonly.interceptor';
import { UserStateInterceptor } from './user-state.interceptor';
import { MetricsInterceptor } from './metrics.interceptor';

export const httpInterceptorProviders: Provider[] = [
  { provide: HTTP_INTERCEPTORS, useClass: LoggingHttpInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: MetricsInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ReadOnlyInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: BusyHttpInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: UserStateInterceptor, multi: true },
];
