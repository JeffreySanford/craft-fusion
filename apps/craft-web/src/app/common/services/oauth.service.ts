import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  // Base URLs for both servers
  private nestApiUrl = 'http://localhost:3000';
  private goApiUrl = 'http://localhost:4000/api-go';

  constructor(private http: HttpClient) {}

  /**
   * Get the URL to start the OAuth authorization process
   * @param useGo Whether to use the Go server (true) or Nest server (false)
   */
  getAuthorizeUrl(useGo: boolean = false): string {
    return useGo 
      ? `${this.goApiUrl}/oauth/nest/authorize` 
      : `${this.nestApiUrl}/oauth/nest/authorize`;
  }

  /**
   * Exchange authorization code for access token
   * @param code The authorization code from callback
   * @param useGo Whether to use the Go server (true) or Nest server (false)
   */
  getAccessToken(code: string, useGo: boolean = false): Observable<TokenResponse> {
    const url = useGo 
      ? `${this.goApiUrl}/oauth/nest/callback?code=${code}` 
      : `${this.nestApiUrl}/oauth/nest/callback?code=${code}`;
    
    return this.http.get<TokenResponse>(url);
  }

  /**
   * Get a client access token
   * @param useGo Whether to use the Go server (true) or Nest server (false)
   */
  getClientAccessToken(useGo: boolean = false): Observable<TokenResponse> {
    const url = useGo 
      ? `${this.goApiUrl}/oauth/nest/token` 
      : `${this.nestApiUrl}/oauth/nest/token`;
    
    return this.http.post<TokenResponse>(url, {});
  }

  /**
   * Refresh an access token using a refresh token
   * @param refreshToken The refresh token
   * @param useGo Whether to use the Go server (true) or Nest server (false)
   */
  refreshToken(refreshToken: string, useGo: boolean = false): Observable<TokenResponse> {
    const url = useGo 
      ? `${this.goApiUrl}/oauth/nest/refresh` 
      : `${this.nestApiUrl}/oauth/nest/refresh`;
    
    return this.http.post<TokenResponse>(url, { refresh_token: refreshToken });
  }

  /**
   * Revoke an access token
   * @param token The token to revoke
   * @param useGo Whether to use the Go server (true) or Nest server (false)
   */
  revokeToken(token: string, useGo: boolean = false): Observable<any> {
    const url = useGo 
      ? `${this.goApiUrl}/oauth/nest/revoke` 
      : `${this.nestApiUrl}/oauth/nest/revoke`;
    
    return this.http.post(url, { token });
  }
}
