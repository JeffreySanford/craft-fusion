import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { LoggerService } from "../services/logger.service";

@Injectable()
export class LoggingHttpInterceptor implements HttpInterceptor {
    
    constructor(private logger: LoggerService) {
        this.logger.registerService('LoggingHttpInterceptor');
        this.logger.info('LoggingHttpInterceptor initialized');
    }
    
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.logRequest(request);
        const callId = this.logger.startServiceCall('LoggingHttpInterceptor', request.method, request.url);

        return next.handle(request).pipe(
            tap(
                response => {
                    this.logResponse(response);
                    if (response instanceof HttpResponse) {
                        this.logger.endServiceCall(callId, response.status);
                    }
                },
                error => {
                    this.logError(error);
                    const status = error instanceof HttpErrorResponse ? error.status : 500;
                    this.logger.endServiceCall(callId, status);
                }
            )
        );
    }

    logRequest(request: HttpRequest<any>) {
        this.logger.debug(`Request: ${request.method} ${request.urlWithParams}`);
    }

    logResponse(response: HttpEvent<any>) {
        if (response instanceof HttpResponse) {
            this.logger.debug(`Response: ${response.status} ${response.url}`);
        }
    }

    logError(error: HttpErrorResponse) {
        this.logger.error(`HTTP Error: ${error.status} ${error.url || 'unknown url'}`, {
            message: error.message,
            error: error.error
        });
    }
}