import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  constructor(private logger: LoggerService) {
    this.logger.registerService('AuthorizationService');
  }

  canAccessResource(resource: string): Observable<boolean> {
    this.logger.debug('Checking resource access', { resource });

    return of(resource !== 'admin');
  }
}
