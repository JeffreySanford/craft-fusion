import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { Provider } from "@angular/core";
import { AuthHttpInterceptor } from "./auth.interceptor";
import { BusyHttpInterceptor } from "./busy.interceptor";
import { LoggingHttpInterceptor } from "./logging.interceptor";
import { MetricsInterceptor } from "./metrics.interceptor";
import { ReadOnlyInterceptor } from "./readonly.interceptor";
import { UserStateInterceptor } from "./user-state.interceptor";

export const httpInterceptorProviders: Provider[] = [
    { provide: HTTP_INTERCEPTORS, useClass: LoggingHttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ReadOnlyInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: BusyHttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: MetricsInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: UserStateInterceptor, multi: true },
];