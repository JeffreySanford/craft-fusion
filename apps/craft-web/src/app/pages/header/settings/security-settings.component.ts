import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthenticationService } from '../../../common/services/authentication.service';
import { UserStateService } from '../../../common/services/user-state.service';
import { LoggerService } from '../../../common/services/logger.service';
import { ThemeService } from '../../../common/services/theme.service';
import { LayoutService } from '../../../common/services/layout.service';

@Component({
  selector: 'app-security-settings',
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.scss'],
  standalone: false
})
export class SecuritySettingsComponent implements OnInit, OnDestroy {
  securityForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  isPasswordVisible = false;
  mfaEnabled = false;
  currentTheme = '';
  isSidebarExpanded = true;
  
  private destroy$ = new Subject<void>();
  
  // Security level options for dropdown
  securityLevels = [
    { value: 'low', label: 'Low', description: 'Basic account security with password only' },
    { value: 'medium', label: 'Medium', description: 'Enhanced security with email verification' },
    { value: 'high', label: 'High', description: 'Maximum security with two-factor authentication' }
  ];

  constructor(
    private fb: FormBuilder, 
    private snackBar: MatSnackBar,
    private authService: AuthenticationService,
    private userStateService: UserStateService,
    private logger: LoggerService,
    private themeService: ThemeService,
    private layoutService: LayoutService
  ) {
    if (this.logger.registerComponent) {
      this.logger.registerComponent('SecuritySettingsComponent');
    }
    
    // Initialize the security form with controls
    this.securityForm = this.fb.group({
      securityLevel: ['medium', Validators.required],
      emailNotifications: [true],
      loginAlerts: [true],
      activityMonitoring: [false],
      deviceTracking: [true],
      ipFiltering: [false],
      autoLogout: [30, [Validators.required, Validators.min(5), Validators.max(120)]]
    });

    // Initialize the password change form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        // Password pattern: at least one uppercase, lowercase, number, special character
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.logger.info('Initializing security settings');
    
    // Subscribe to theme changes
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
        this.logger.debug('Theme updated in security settings', { theme });
      });
      
    // Load user security settings
    this.isLoading = true;
    
    // Get the security level value
    const securityLevel = this.userStateService.getUserPreference('securityLevel') || 'medium';
    
    // Update the form with the security level
    this.securityForm.patchValue({ securityLevel });
    
    // Configure security features based on the level
    this.configureSecurityFeatures(securityLevel);
    
    this.isLoading = false;
    
    // Log the loaded security settings
    this.logger.info('Security settings loaded', { level: securityLevel });
    
    // Monitor form changes
    this.securityForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        this.logger.debug('Security form values changed', { values });
      });
      
    // Check if the sidebar is collapsed to optimize layout
    this.layoutService.sidebarCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(collapsed => {
        this.isSidebarExpanded = !collapsed;
        this.logger.debug('Sidebar state in security settings', { collapsed });
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.debug('Security settings component destroyed');
  }
  
  // Helper methods for template
  getLevelLabel(level: string): string {
    const secLevel = this.securityLevels.find(l => l.value === level);
    return secLevel ? secLevel.label : '';
  }
  
  getLevelDescription(level: string): string {
    switch (level) {
      case 'high':
        return 'Comprehensive protection with email notifications, login alerts, activity monitoring, and two-factor authentication.';
      case 'medium':
        return 'Enhanced security with email notifications and basic monitoring features.';
      case 'low':
        return 'Basic security with password-only authentication.';
      default:
        return '';
    }
  }
  
  getIconForLevel(level: string): string {
    switch (level) {
      case 'high': return 'security';
      case 'medium': return 'shield';
      case 'low': return 'lock_open';
      default: return 'help_outline';
    }
  }
  
  getIconColor(level: string): string {
    switch (level) {
      case 'high': return 'accent';
      case 'medium': return 'primary';
      case 'low': return 'warn';
      default: return '';
    }
  }
  
  // Custom validator to check that passwords match
  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  // Helper methods for password validation in template
  hasUppercase(value: string | undefined | null): boolean {
    return !!value && /[A-Z]/.test(value);
  }
  
  hasLowercase(value: string | undefined | null): boolean {
    return !!value && /[a-z]/.test(value);
  }
  
  hasNumber(value: string | undefined | null): boolean {
    return !!value && /[0-9]/.test(value);
  }
  
  hasSpecialCharacter(value: string | undefined | null): boolean {
    return !!value && /[^A-Za-z0-9]/.test(value);
  }

  // Save security settings
  saveSecuritySettings() {
    if (this.securityForm.invalid) {
      this.logger.warn('Attempted to save invalid security form', {
        errors: this.getFormValidationErrors(this.securityForm)
      });
      return;
    }
    
    this.isLoading = true;
    const settings = this.securityForm.value;
    
    this.logger.info('Saving security settings', { settings });
    
    // Store security level in user preferences
    this.userStateService.setUserPreference('securityLevel', settings.securityLevel);
    
    // Enable or configure security features based on selected level
    this.configureSecurityFeatures(settings.securityLevel);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open('Security settings saved successfully', 'Close', {
        duration: 3000,
        panelClass: ['patriotic-snackbar']
      });
      this.logger.info('Security settings updated successfully', { level: settings.securityLevel });
    }, 800);
  }
  
  // Update security features based on selected level
  configureSecurityFeatures(level: string) {
    this.logger.debug('Configuring security features', { level });
    
    switch (level) {
      case 'high':
        this.securityForm.patchValue({
          emailNotifications: true,
          loginAlerts: true,
          activityMonitoring: true,
          deviceTracking: true,
          ipFiltering: true,
          autoLogout: 15
        });
        this.mfaEnabled = true;
        break;
      case 'medium':
        this.securityForm.patchValue({
          emailNotifications: true,
          loginAlerts: true,
          activityMonitoring: false,
          deviceTracking: true,
          ipFiltering: false,
          autoLogout: 30
        });
        this.mfaEnabled = false;
        break;
      case 'low':
        this.securityForm.patchValue({
          emailNotifications: false,
          loginAlerts: false,
          activityMonitoring: false,
          deviceTracking: false,
          ipFiltering: false,
          autoLogout: 60
        });
        this.mfaEnabled = false;
        break;
    }
  }
  
  // Change password
  changePassword() {
    if (this.passwordForm.invalid) {
      this.logger.warn('Attempted to submit invalid password form', {
        errors: this.getFormValidationErrors(this.passwordForm)
      });
      return;
    }
    
    this.isLoading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    
    this.logger.info('Initiating password change');
    
    // Using the authentication service's changePassword method
    this.authService.changePassword(currentPassword, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.isLoading = false;
          this.passwordForm.reset();
          this.snackBar.open('Password changed successfully', 'Close', {
            duration: 3000,
            panelClass: ['patriotic-snackbar']
          });
          this.logger.info('Password changed successfully');
        },
        error => {
          this.isLoading = false;
          this.snackBar.open('Failed to change password: ' + error.message, 'Close', {
            duration: 5000,
            panelClass: ['patriotic-error-snackbar']
          });
          this.logger.error('Password change failed', { error });
        }
      );
  }
  
  // Toggle password visibility
  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
    this.logger.debug('Password visibility toggled', { visible: this.isPasswordVisible });
  }
  
  // Enable two-factor authentication
  enableTwoFactor() {
    this.isLoading = true;
    this.logger.info('Enabling two-factor authentication');
    
    // Implement 2FA setup process here
    setTimeout(() => {
      this.mfaEnabled = true;
      this.isLoading = false;
      this.snackBar.open('Two-factor authentication enabled', 'Close', {
        duration: 3000,
        panelClass: ['patriotic-snackbar']
      });
      this.logger.info('Two-factor authentication enabled successfully');
    }, 1000);
  }
  
  // Reset security settings to defaults
  resetToDefaults() {
    this.logger.info('Resetting security settings to defaults');
    
    this.securityForm.reset({
      securityLevel: 'medium',
      emailNotifications: true,
      loginAlerts: true,
      activityMonitoring: false,
      deviceTracking: true,
      ipFiltering: false,
      autoLogout: 30
    });
    
    this.userStateService.setUserPreference('securityLevel', 'medium');
    
    this.snackBar.open('Security settings reset to defaults', 'Close', {
      duration: 3000,
      panelClass: ['patriotic-snackbar']
    });
    
    this.logger.info('Security settings reset to defaults');
  }
  
  // Helper method to get form validation errors
  private getFormValidationErrors(form: FormGroup): any {
    const result: any = {};
    Object.keys(form.controls).forEach(key => {
      const controlErrors = form.get(key)?.errors;
      if (controlErrors) {
        result[key] = controlErrors;
      }
    });
    return result;
  }
}
