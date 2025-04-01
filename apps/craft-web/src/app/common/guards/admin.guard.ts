import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // Use !! to ensure we return a boolean
        const isAdmin = !!user && !!user.roles && user.roles.includes('admin');
        
        if (!isAdmin) {
          this.logger.warn('Access to admin section denied - user is not an admin', {
            userId: user?.id,
            requestedUrl: state.url,
            category: 'SECURITY'
          });
        }
        
        // Always return boolean, not boolean | null
        return isAdmin;
      }),
      tap(isAdmin => {
        if (!isAdmin) {
          this.router.navigate(['/']);
        }
      })
    );
  }
}
