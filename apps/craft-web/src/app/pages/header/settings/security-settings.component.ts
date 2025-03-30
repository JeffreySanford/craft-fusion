import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserFacadeService } from '../../../common/facades/user-facade.service';
import { SecurityLevel } from '../../../common/services/authorization.service';
import { NotificationService } from '../../../common/services/notification.service';
import { LoggerService } from '../../../common/services/logger.service';
import { ApiService } from '../../../common/services/api.service';

@Component({
  selector: 'app-security-settings',
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.scss'],
  standalone: false
})
export class SecuritySettingsComponent implements OnInit {
  securityForm: FormGroup;
  isAdmin = false;
  isServerOnline = true;
  
  securityLevels = [
    { 
      value: 'low', 
      label: 'Low', 
      description: 'Basic security checks. Admin users get full access. Suitable for development/testing.',
      icon: 'security'
    },
    { 
      value: 'moderate', 
      label: 'Moderate', 
      description: 'Standard security with role-based access control. Suitable for most production environments.',
      icon: 'shield'
    },
    { 
      value: 'high', 
      label: 'High', 
      description: 'Enhanced security with server verification for all permission checks. Highest protection but may impact performance.',
      icon: 'gpp_good'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private userFacade: UserFacadeService,
    private notification: NotificationService,
    private logger: LoggerService,
    private apiService: ApiService
  ) {
    this.securityForm = this.fb.group({
      securityLevel: ['moderate'],
      enableAuditLogs: [true],
      enforceStrongPasswords: [true],
      sessionTimeout: [30],
      requireMfa: [false]
    });
  }

  ngOnInit(): void {
    // Check if user is admin
    this.isAdmin = this.userFacade.isAdmin();
    
    if (!this.isAdmin) {
      this.securityForm.disable();
    }
    
    // Set initial security level
    const currentLevel = this.userFacade.getSecurityLevel();
    this.securityForm.get('securityLevel')?.setValue(currentLevel);
    
    // Add listener for security level changes
    this.securityForm.get('securityLevel')?.valueChanges.subscribe((level: SecurityLevel) => {
      if (this.isAdmin) {
        this.userFacade.setSecurityLevel(level);
        this.logger.info('Security level changed', { level });
      }
    });

    // Monitor server connection status
    this.apiService.serverStatus$.subscribe(status => {
      this.isServerOnline = status.isOnline;
      if (!this.isServerOnline) {
        this.logger.warn('Security settings: Server appears to be offline');
      }
    });
  }

  saveSettings(): void {
    if (!this.isAdmin) {
      this.notification.showError('You do not have permission to change security settings');
      return;
    }
    
    if (!this.isServerOnline) {
      this.notification.showError('Cannot save settings: Server is offline');
      return;
    }
    
    const formValues = this.securityForm.value;
    
    // Apply security level
    this.userFacade.setSecurityLevel(formValues.securityLevel);
    
    // In a real app, you would save the other security settings to the server
    // this.securityService.updateSettings(formValues).subscribe(...)
    
    this.notification.showSuccess('Security settings updated successfully');
  }

  getSecurityLevelInfo(level: string): any {
    return this.securityLevels.find(l => l.value === level);
  }
}
