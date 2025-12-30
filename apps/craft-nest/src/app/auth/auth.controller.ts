import { Controller, Post, Body, HttpException, HttpStatus, Logger, HttpCode } from '@nestjs/common';
import { AuthService, User } from './auth.service';
import { Observable, catchError, map, throwError } from 'rxjs';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {
    this.logger.log('Auth controller initialized');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Always return 200 on successful login
  login(@Body() loginRequest: LoginRequest): Observable<LoginResponse> {
    // Ensure password is passed to the service for validation
    this.logger.debug(`Login request received`, {
      username: loginRequest.username,
      timestamp: new Date().toISOString()
    });

    // Add request timing measurement
    const startTime = performance.now();

    return this.authService.validateUser(loginRequest.username, loginRequest.password).pipe(
      map(user => {
        if (!user) {
          this.logger.warn(`Login failed - invalid credentials`, {
            username: loginRequest.username,
            elapsedMs: Math.round(performance.now() - startTime)
          });
          throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }        
        
        const token = this.authService.generateToken(user);
        
        this.logger.log(`Login successful for user`, {
          username: user.username,
          role: user.role,
          elapsedMs: Math.round(performance.now() - startTime)
        });
        
        // Adapt backend User model to frontend expectations (role -> roles)
        const adaptedUser = {
          ...user,
          roles: [user.role], // Convert single role to roles array for frontend
        };
        
        return {
          token,
          user: adaptedUser
        };
      }),
      catchError(error => {
        this.logger.error(`Login error`, {
          username: loginRequest.username,
          error: error.message,
          stack: error.stack?.split('\n')[0],
          elapsedMs: Math.round(performance.now() - startTime)
        });
        
        return throwError(() => new HttpException(
          error.message || 'Login failed', 
          error.status || HttpStatus.INTERNAL_SERVER_ERROR
        ));
      })
    );
  }
}
