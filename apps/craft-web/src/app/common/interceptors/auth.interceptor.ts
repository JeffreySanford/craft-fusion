import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, EMPTY, finalize, Observable, throwError } from "rxjs";
import { AuthenticationService } from "../services/authentication.service";
import { BusyService } from "../services/busy.service";
import { LoggerService } from "../services/logger.service";

@Injectable({ providedIn: 'root' })
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(
        private authenticationService: AuthenticationService, 
        private router: Router,
        private logger: LoggerService
    ) {
        this.logger.registerService('AuthHttpInterceptor');
        this.logger.info('AuthHttpInterceptor initialized');
    }
    
    intercept(request: HttpRequest<any>, next: HttpHandler) {
        // Get token from auth service
        const token = this.authenticationService.getAuthToken();
        const callId = this.logger.startServiceCall('AuthHttpInterceptor', request.method, request.url);
        
        // Only add token if we have one
        if (token) {
            const headers = { 'Authorization': `Bearer ${token}` };
            this.logger.debug(`Adding auth token to request: ${request.url}`);
            
            request = request.clone({
                setHeaders: headers,
                withCredentials: true
            });
        } else {
            this.logger.debug(`No auth token available for request: ${request.url}`);
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                const status = error.status;
                this.logger.endServiceCall(callId, status);
                
                if (status === 401) {
                    return this.handle401(error);
                }
                
                // Log all other errors
                this.logger.error(`Request failed: ${request.url}`, {
                    status,
                    statusText: error.statusText,
                    message: error.message
                });
                
                return throwError(() => error);
            }),
            finalize(() => {
                // We don't call endServiceCall here as it's already handled in the error case
                // and for success cases, other interceptors (like metrics) handle it
            })
        );
    }

    private handle401(error: HttpErrorResponse) {
        const authResHeader = error.headers.get('WWW-Authenticate');

        if (authResHeader) {
            this.logger.warn('Authentication failed', { header: authResHeader });
            if (/is expired/.test(authResHeader)) {
                this.logger.info('Token expired, redirecting to login');
                this.router.navigate(['login']);  // Token expired, leave app and sign-in again
            }
        } else {
            this.logger.warn('Authentication required', { url: error.url });
        }

        /**
         * The error is handled. Call should get non-response. Empty completes without emitting
         */
        return EMPTY;
    }
}