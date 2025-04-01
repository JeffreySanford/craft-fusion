import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Renderer2, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../common/services/theme.service';
import { LayoutService } from '../../common/services/layout.service';
import { LoggerService } from '../../common/services/logger.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [
        animate('1200ms 300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      state('void', style({ transform: 'translateY(30px)', opacity: 0 })),
      transition(':enter', [
        animate('800ms 400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      state('void', style({ transform: 'scale(0.9)', opacity: 0 })),
      transition(':enter', [
        animate('1000ms 500ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ]),
    trigger('stagger', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('600ms {{delay}}ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  standalone: false
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('particleContainer') particleContainer!: ElementRef;
  
  currentTheme = '';
  particlesCount = 20;
  particles: {x: number, y: number, size: number, speed: number, color: string}[] = [];
  private destroy$ = new Subject<void>();
  private animationFrameId: number | null = null;
  
  // Features for staggered animation
  features = [
    { icon: 'dashboard', title: 'Intuitive Dashboard', description: 'Powerful analytics and monitoring at your fingertips.' },
    { icon: 'security', title: 'Advanced Security', description: 'Enterprise-grade security with patriotic commitment.' },
    { icon: 'assessment', title: 'Real-time Metrics', description: 'Visualize performance with interactive charts.' },
    { icon: 'build', title: 'Customizable Tools', description: 'Adapt the platform to your specific needs.' },
  ];

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private layoutService: LayoutService,
    private renderer: Renderer2,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });
    
    // Configure layout for landing page (fullscreen, no sidebar)
    this.layoutService.configureLayout({
      header: true,
      footer: true,
      sidebar: false,
      sidebarExpanded: false
    });
    
    this.initializeParticles();
    
    this.logger.info('Landing page initialized');
  }

  ngAfterViewInit(): void {
    this.startParticleAnimation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Reset layout configuration when leaving
    this.layoutService.resetLayout();
    
    this.logger.info('Landing page destroyed');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getAnimationDelay(index: number): { delay: number } {
    return { delay: 150 * (index + 1) };
  }

  private initializeParticles(): void {
    // Clear any existing particles
    this.particles = [];
    
    // Create new particles with patriotic colors
    const colors = ['#FFD700', '#002868', '#BF0A30']; // Gold, Navy, Red
    
    for (let i = 0; i < this.particlesCount; i++) {
      this.particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 3,
        speed: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private startParticleAnimation(): void {
    if (!this.particleContainer) return;
    
    const container = this.particleContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();
    
    const animateParticles = () => {
      this.particles = this.particles.map(particle => {
        // Move particle up
        particle.y -= particle.speed;
        
        // Reset particle if it goes off screen
        if (particle.y < -10) {
          particle.y = 110; // Start below the container
          particle.x = Math.random() * 100;
        }
        
        return particle;
      });
      
      // Draw particles
      this.drawParticles(container, containerRect);
      
      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(animateParticles);
    };
    
    // Start animation loop
    this.animationFrameId = requestAnimationFrame(animateParticles);
  }

  private drawParticles(container: HTMLElement, containerRect: DOMRect): void {
    // Clear container first
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Create and position particles
    this.particles.forEach(particle => {
      const particleEl = this.renderer.createElement('div');
      this.renderer.addClass(particleEl, 'particle');
      this.renderer.setStyle(particleEl, 'width', `${particle.size}px`);
      this.renderer.setStyle(particleEl, 'height', `${particle.size}px`);
      this.renderer.setStyle(particleEl, 'backgroundColor', particle.color);
      this.renderer.setStyle(particleEl, 'left', `${particle.x}%`);
      this.renderer.setStyle(particleEl, 'top', `${particle.y}%`);
      
      // Add particle to container
      this.renderer.appendChild(container, particleEl);
    });
  }
}
