import * as CryptoJS from 'crypto-js';

/**
 * Utility class for handling JWT security operations including encryption and decryption
 */
export class JwtSecurityUtil {
  private static readonly TOKEN_KEY_PREFIX = 'cf_auth_';
  private static readonly ENCRYPTION_KEY = 'your-strong-encryption-key'; // In production, this would be loaded from environment
  
  // Callback for audit logging
  private static auditCallback: (eventType: string, data: any) => void;
  
  /**
   * Set audit callback function
   */
  static setAuditCallback(callback: (eventType: string, data: any) => void): void {
    JwtSecurityUtil.auditCallback = callback;
  }
  
  /**
   * Log an audit event if callback is set
   */
  private static audit(eventType: string, data: any): void {
    if (JwtSecurityUtil.auditCallback) {
      JwtSecurityUtil.auditCallback(eventType, data);
    }
  }
  
  /**
   * Encrypts a JWT token for additional security
   * @param token Raw JWT token
   * @returns Encrypted token string
   */
  static encryptToken(token: string): string {
    if (!token) return '';
    try {
      const encrypted = CryptoJS.AES.encrypt(token, this.ENCRYPTION_KEY).toString();
      this.audit('token_encrypted', { success: true });
      return encrypted;
    } catch (error) {
      this.audit('token_encryption_failed', { error: error?.message, stack: error?.stack });
      console.error('Token encryption failed', error);
      return token; // Return original token if encryption fails
    }
  }
  
  /**
   * Decrypts an encrypted JWT token
   * @param encryptedToken Encrypted token string
   * @returns Decrypted JWT token
   */
  static decryptToken(encryptedToken: string): string {
    if (!encryptedToken) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedToken, this.ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      this.audit('token_decrypted', { success: true });
      return decrypted;
    } catch (error) {
      this.audit('token_decryption_failed', { error: error?.message, stack: error?.stack });
      console.error('Token decryption failed', error);
      return ''; // Return empty string on decryption failure
    }
  }
  
  /**
   * Parse JWT token and extract payload without validation
   * @param token JWT token
   * @returns Parsed payload or null if invalid
   */
  static parseToken(token: string): any {
    if (!token) return null;
    
    try {
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.audit('token_parse_failed', { reason: 'Invalid token format' });
        return null;
      }
      
      // The second part is the payload
      const payload = JSON.parse(atob(parts[1]));
      this.audit('token_parsed', { 
        jti: payload.jti, 
        sub: payload.sub,
        exp: payload.exp,
        iat: payload.iat
      });
      
      return payload;
    } catch (error) {
      this.audit('token_parse_failed', { error: error?.message });
      return null;
    }
  }
  
  /**
   * Securely stores a token with encryption
   * @param token JWT token
   * @param tokenType Type of token (access, refresh, etc.)
   */
  static storeToken(token: string, tokenType: string = 'access'): void {
    if (!token) return;
    
    try {
      const encryptedToken = this.encryptToken(token);
      const key = `${this.TOKEN_KEY_PREFIX}${tokenType}`;
      
      localStorage.setItem(key, encryptedToken);
      
      // Get payload for audit
      const payload = this.parseToken(token);
      this.audit('token_stored', { 
        tokenType,
        jti: payload?.jti,
        exp: payload?.exp
      });
    } catch (e) {
      this.audit('token_store_failed', { error: e?.message });
      console.error('Failed to store token', e);
    }
  }
  
  /**
   * Retrieves and decrypts a stored token
   * @param tokenType Type of token to retrieve
   * @returns Decrypted JWT token or null if not found
   */
  static retrieveToken(tokenType: string = 'access'): string | null {
    try {
      const key = `${this.TOKEN_KEY_PREFIX}${tokenType}`;
      const encryptedToken = localStorage.getItem(key);
      
      if (!encryptedToken) {
        this.audit('token_retrieve_failed', { reason: 'Token not found', tokenType });
        return null;
      }
      
      const token = this.decryptToken(encryptedToken);
      
      // Get payload for audit
      const payload = this.parseToken(token);
      this.audit('token_retrieved', { 
        tokenType, 
        jti: payload?.jti,
        exp: payload?.exp
      });
      
      return token;
    } catch (e) {
      this.audit('token_retrieve_failed', { error: e?.message });
      return null;
    }
  }
  
  /**
   * Remove stored token
   * @param tokenType Type of token to remove
   */
  static removeToken(tokenType: string = 'access'): void {
    const key = `${this.TOKEN_KEY_PREFIX}${tokenType}`;
    localStorage.removeItem(key);
    this.audit('token_removed', { tokenType });
  }
  
  /**
   * Clear all tokens
   */
  static clearAllTokens(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.TOKEN_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    this.audit('all_tokens_cleared', {});
  }
  
  /**
   * Generate a CSRF token
   * @returns A new random CSRF token
   */
  static generateCsrfToken(): string {
    const random = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    const token = CryptoJS.SHA256(random).toString();
    this.audit('csrf_token_generated', { token: token.substring(0, 10) + '...' });
    return token;
  }
  
  /**
   * Store CSRF token
   * @param token CSRF token
   */
  static storeCsrfToken(token: string): void {
    localStorage.setItem(`${this.TOKEN_KEY_PREFIX}csrf`, token);
    this.audit('csrf_token_stored', { token: token.substring(0, 10) + '...' });
  }
  
  /**
   * Get stored CSRF token
   * @returns Stored CSRF token or null if not found
   */
  static getCsrfToken(): string | null {
    const token = localStorage.getItem(`${this.TOKEN_KEY_PREFIX}csrf`);
    this.audit('csrf_token_retrieved', { 
      found: !!token, 
      token: token ? token.substring(0, 10) + '...' : null 
    });
    return token;
  }
  
  /**
   * Create a fingerprint of the browser environment
   * This helps detect session theft by providing additional verification
   */
  static createFingerprint(): string {
    const browser = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    // Combine factors and hash them
    const fingerprintData = `${browser}|${screen}|${timezone}|${language}`;
    const fingerprint = CryptoJS.SHA256(fingerprintData).toString();
    
    this.audit('fingerprint_created', { 
      browser: navigator.userAgent,
      fingerprint: fingerprint.substring(0, 10) + '...' 
    });
    
    return fingerprint;
  }
  
  /**
   * Store the browser fingerprint
   */
  static storeFingerprint(): void {
    const fingerprint = this.createFingerprint();
    localStorage.setItem(`${this.TOKEN_KEY_PREFIX}fingerprint`, fingerprint);
    this.audit('fingerprint_stored', { fingerprint: fingerprint.substring(0, 10) + '...' });
  }
  
  /**
   * Verify the current environment against the stored fingerprint
   * @returns Boolean indicating if fingerprint matches
   */
  static verifyFingerprint(): boolean {
    const storedFingerprint = localStorage.getItem(`${this.TOKEN_KEY_PREFIX}fingerprint`);
    if (!storedFingerprint) {
      this.audit('fingerprint_verification_failed', { reason: 'No stored fingerprint' });
      return false;
    }
    
    const currentFingerprint = this.createFingerprint();
    const isMatch = storedFingerprint === currentFingerprint;
    
    this.audit('fingerprint_verified', { 
      isMatch,
      storedFingerprint: storedFingerprint.substring(0, 10) + '...',
      currentFingerprint: currentFingerprint.substring(0, 10) + '...'
    });
    
    return isMatch;
  }
}
