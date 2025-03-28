import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state, group, animateChild } from '@angular/animations';
import { AnimationDataService, AnimationExample } from '../../../common/services/animation-data.service';

// Animation definitions with default parameters
const animationShowcaseAnimations = [
  trigger('showcaseAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('{{delay}}ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 1, transform: 'translateY(0)' }))
    ], { params: { delay: 300 } })
  ]),
  trigger('categoryAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(30px)' }),
      animate('{{delay}}ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 1, transform: 'translateY(0)' }))
    ], { params: { delay: 300 } })
  ]),
  trigger('containerAnimation', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        stagger(100, [
          animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
            style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ]),
  // Demo animations for showcasing
  trigger('fadeInOut', [
    state('in', style({ opacity: 1 })),
    state('out', style({ opacity: 0 })),
    transition('in => out', animate('400ms ease-out')),
    transition('out => in', animate('400ms ease-in'))
  ]),
  trigger('slideInOut', [
    state('in', style({ transform: 'translateX(0)' })),
    state('out', style({ transform: 'translateX(-100%)' })),
    transition('in => out', animate('400ms ease-out')),
    transition('out => in', animate('400ms ease-in'))
  ]),
  trigger('expandCollapse', [
    state('expanded', style({ height: '*', opacity: 1 })),
    state('collapsed', style({ height: '0px', opacity: 0 })),
    transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]),
  trigger('listAnimation', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, height: 0 }),
        stagger(100, [
          animate('300ms ease-out', style({ opacity: 1, height: '*' }))
        ])
      ], { optional: true })
    ])
  ])
];

@Component({
  selector: 'app-material-animations',
  templateUrl: './material-animations.component.html',
  styleUrls: ['./material-animations.component.scss'],
  animations: animationShowcaseAnimations,
  standalone: false
})
export class MaterialAnimationsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Animation categories and examples
  categories: any[] = [];
  searchTerm = '';
  filteredCategories: any[] = [];
  
  // Pagination
  itemsPerPage = 4;
  currentPage = 0;
  totalPages = 0;
  paginatedCategories: any[] = [];
  
  // Demo states for interactive examples
  animationStates: { [key: string]: string } = {};
  selectedAnimation: AnimationExample | null = null;
  
  // Intersection observer for scroll animations
  private observer: IntersectionObserver | null = null;

  constructor(
    private router: Router,
    private animationDataService: AnimationDataService // Remove @Inject decorator
  ) {}

  ngOnInit() {
    this.loadAnimationData();
    this.handleScreenResize();
    window.addEventListener('resize', this.handleScreenResize.bind(this));
  }
  
  ngAfterViewInit() {
    this.setupScrollAnimations();
  }
  
  ngOnDestroy() {
    window.removeEventListener('resize', this.handleScreenResize.bind(this));
    if (this.observer) {
      this.observer.disconnect();
    }
  }
  
  loadAnimationData() {
    this.categories = this.animationDataService.getAnimationCategories();
    this.filteredCategories = [...this.categories];
    
    // Initialize animation states for all examples
    this.categories.forEach(category => {
      category.examples.forEach((example: AnimationExample) => {
        this.animationStates[example.id] = example.defaultState || 'default';
      });
    });
    
    this.calculateTotalPages();
    this.updatePaginatedCategories();
  }

  handleScreenResize() {
    const width = window.innerWidth;
    
    if (width < 600) {
      this.itemsPerPage = 2;
    } else if (width < 960) {
      this.itemsPerPage = 3;
    } else {
      this.itemsPerPage = 4;
    }
    
    this.calculateTotalPages();
    this.updatePaginatedCategories();
  }
  
  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.itemsPerPage);
  }
  
  updatePaginatedCategories() {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedCategories = this.filteredCategories.slice(start, end);
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePaginatedCategories();
    }
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePaginatedCategories();
    }
  }
  
  navigateToIcons() {
    this.router.navigateByUrl('/material-icons');
  }
  
  navigateToButtons() {
    this.router.navigateByUrl('/material-buttons');
  }
  
  // Search functionality
  filterAnimations() {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      
      this.filteredCategories = this.categories
        .map(category => {
          // Filter animations within each category
          const filteredExamples = category.examples.filter((example: AnimationExample) => 
            example.name.toLowerCase().includes(term) || 
            example.description.toLowerCase().includes(term) || 
            example.type.toLowerCase().includes(term)
          );
          
          // Return category with filtered examples if any match
          if (filteredExamples.length > 0) {
            return { ...category, examples: filteredExamples };
          }
          return null;
        })
        .filter(category => category !== null);
    }
    
    // Reset pagination
    this.currentPage = 0;
    this.calculateTotalPages();
    this.updatePaginatedCategories();
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.filterAnimations();
  }
  
  // Animation demo functionality
  toggleAnimationState(animationId: string) {
    const currentState = this.animationStates[animationId];
    const newState = currentState === 'in' ? 'out' : 
                    currentState === 'out' ? 'in' : 
                    currentState === 'expanded' ? 'collapsed' : 
                    currentState === 'collapsed' ? 'expanded' : 
                    currentState === 'default' ? 'active' : 'default';
                    
    this.animationStates[animationId] = newState;
  }
  
  showAnimationDemo(animation: AnimationExample) {
    this.selectedAnimation = animation;
  }
  
  // Set up scroll animations
  setupScrollAnimations() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);
    
    document.querySelectorAll('.scroll-animation').forEach(el => {
      this.observer?.observe(el);
    });
  }
}
