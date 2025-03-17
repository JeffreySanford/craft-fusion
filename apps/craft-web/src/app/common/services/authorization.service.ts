import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  constructor() { }

  canAccessResource(resource: string): Observable<boolean> {
    // In a real application, this would check the user's roles/permissions
    // against the requested resource.
    // For this example, we'll just return true for 'admin' and false otherwise.
    return of(resource === 'admin');
  }
}
