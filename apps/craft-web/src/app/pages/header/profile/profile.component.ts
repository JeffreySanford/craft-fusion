import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../../common/services/theme.service';
import { UserFacadeService } from '../../../common/facades/user-facade.service';
import { AuthenticationService } from '../../../common/services/authentication.service';
import { NotificationService } from '../../../common/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('pulse', [
      state('inactive', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.05)' })),
      transition('inactive <=> active', animate('0.3s ease-in-out'))
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  userProfile: any = {};
  isLoading = false;
  isEditing = false;
  avatarOptions: string[] = [];
  selectedAvatar: string = '';
  themeClass = '';
  pulseState: 'active' | 'inactive' = 'inactive';
  isAdmin = false;
  
  private destroy$ = new Subject<void>();
  private pulseInterval: any;
  
  // Define skill levels for dropdown
  skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  constructor(
    private fb: FormBuilder,
    private themeService: ThemeService,
    private userFacade: UserFacadeService,
    private authService: AuthenticationService,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      title: ['', Validators.maxLength(100)],
      bio: ['', Validators.maxLength(500)],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(/^\+?[0-9\s\-()]+$/)],
      skillLevel: ['intermediate'],
      preferredTheme: ['light'],
      enableNotifications: [true],
      showAvatarInHeader: [true],
      enableAdminFeatures: [false] // Admin-only feature
    });
  }

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
      
    // Check user admin status
    this.checkAdminStatus();
    
    // Load user profile data
    this.loadUserProfile();
    
    // Generate avatar options
    this.generateAvatarOptions();
    
    // Start pulsing effect on save button
    this.startPulsing();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
    }
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    // Simulate loading user profile data
    setTimeout(() => {
      // Mock user data - in a real app, get this from a service
      this.userProfile = {
        displayName: 'John Smith',
        title: 'Senior Developer',
        bio: 'Passionate about web development and new technologies.',
        email: 'john.smith@example.com',
        phone: '+1 (555) 123-4567',
        avatar: 'assets/images/avatars/avatar-1.png',
        skillLevel: 'advanced',
        preferredTheme: this.themeService.getCurrentTheme(),
        enableNotifications: true,
        showAvatarInHeader: true,
        enableAdminFeatures: false
      };
      
      // Set form values
      this.profileForm.patchValue(this.userProfile);
      
      // Set selected avatar
      this.selectedAvatar = this.userProfile.avatar;
      
      this.isLoading = false;
    }, 800);
  }
  
  generateAvatarOptions(): void {
    // Generate avatar options - in a real app, get these from an API
    for (let i = 1; i <= 6; i++) {
      this.avatarOptions.push(`assets/images/avatars/avatar-${i}.png`);
    }
  }
  
  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
  }
  
  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      // Enable form fields when editing
      this.profileForm.enable();
      
      // Disable admin features if not admin
      if (!this.isAdmin) {
        this.profileForm.get('enableAdminFeatures')?.disable();
      }
    } else {
      // Reset form to original values if canceling
      this.profileForm.patchValue(this.userProfile);
      
      // Disable form fields when not editing
      this.profileForm.disable();
    }
  }
  
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.notificationService.showError('Please correct the errors in the form.');
      return;
    }
    
    this.isLoading = true;
    
    // Get form values
    const formValues = this.profileForm.value;
    
    // Update local user profile
    this.userProfile = {
      ...this.userProfile,
      ...formValues,
      avatar: this.selectedAvatar
    };
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.isEditing = false;
      
      // Update theme preference if changed
      if (formValues.preferredTheme !== this.themeService.getCurrentTheme()) {
        this.themeService.setTheme(formValues.preferredTheme);
      }
      
      this.notificationService.showSuccess('Profile updated successfully!');
      
      // Disable form fields after saving
      this.profileForm.disable();
    }, 1200);
  }
  
  checkAdminStatus(): void {
    // Check if user has admin role
    this.authService.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdmin => {
        this.isAdmin = isAdmin;
        
        // If not admin, disable the admin features control
        if (!this.isAdmin) {
          this.profileForm.get('enableAdminFeatures')?.disable();
        }
      });
  }
  
  startPulsing(): void {
    // Create pulsing effect on save button
    this.pulseInterval = setInterval(() => {
      this.pulseState = this.pulseState === 'active' ? 'inactive' : 'active';
    }, 2000);
  }
  
  // For avatar position randomization
  getRandomTransform(): string {
    const rotate = Math.floor(Math.random() * 10) - 5;
    return `rotate(${rotate}deg)`;
  }
}
