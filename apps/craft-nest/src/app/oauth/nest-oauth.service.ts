import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class NestOAuthService {
  // OAuth URLs hardcoded in service instead of environment
  private readonly NEST_REDIRECT_URI = 'https://jeffreysanford.us/nest/callback';
  private readonly NEST_ACCESS_TOKEN_URL = 'https://api.nest.com/oauth2/access_token';
  private readonly NEST_CLIENT_ACCESS_TOKEN_URL = 'https://api.nest.com/oauth2/client_access_token';
  private readonly NEST_CLIENT_REFRESH_TOKEN_URL = 'https://api.nest.com/oauth2/client_refresh_token';
  private readonly NEST_CLIENT_REVOKE_TOKEN_URL = 'https://api.nest.com/oauth2/client_revoke_token';

  // These would ideally be securely stored, but for now they're hardcoded
  private readonly CLIENT_ID = 'your-client-id';
  private readonly CLIENT_SECRET = 'your-client-secret';

  constructor(private httpService: HttpService) {}

  /**
   * Get the OAuth redirect URI
   */
  getRedirectUri(): string {
    return this.NEST_REDIRECT_URI;
  }

  /**
   * Exchange authorization code for access token
   * @param code The authorization code from OAuth callback
   */
  getAccessToken(code: string): Observable<any> {
    const payload = {
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.NEST_REDIRECT_URI
    };

    return this.httpService.post(this.NEST_ACCESS_TOKEN_URL, payload).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(`Failed to get access token: ${error.message}`)))
    );
  }

  /**
   * Get client access token
   */
  getClientAccessToken(): Observable<any> {
    const payload = {
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      grant_type: 'client_credentials'
    };

    return this.httpService.post(this.NEST_CLIENT_ACCESS_TOKEN_URL, payload).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(`Failed to get client access token: ${error.message}`)))
    );
  }

  /**
   * Refresh client token
   * @param refreshToken The refresh token to use
   */
  refreshClientToken(refreshToken: string): Observable<any> {
    const payload = {
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };

    return this.httpService.post(this.NEST_CLIENT_REFRESH_TOKEN_URL, payload).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(`Failed to refresh token: ${error.message}`)))
    );
  }

  /**
   * Revoke client token
   * @param token The token to revoke
   */
  revokeClientToken(token: string): Observable<any> {
    const payload = {
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      token
    };

    return this.httpService.post(this.NEST_CLIENT_REVOKE_TOKEN_URL, payload).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(`Failed to revoke token: ${error.message}`)))
    );
  }
}
