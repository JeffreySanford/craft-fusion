import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';

// Button component animations with default parameters
const buttonAnimations = [
  trigger('buttonAppear', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.8)' }),
      animate('{{delay}}ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 1, transform: 'scale(1)' }))
    ], { params: { delay: 300 } })
  ]),
  trigger('cardAppear', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(30px)' }),
      animate('{{delay}}ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 1, transform: 'translateY(0)' }))
    ], { params: { delay: 300 } })
  ]),
  trigger('cardAnimation', [
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
  trigger('buttonFocus', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.9)' }),
      animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 1, transform: 'scale(1)' }))
    ]),
    transition(':leave', [
      animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ opacity: 0, transform: 'scale(0.9)' }))
    ])
  ])
];

@Component({
  selector: 'app-material-buttons',
  templateUrl: './material-buttons.component.html',
  styleUrls: ['./material-buttons.component.scss'],
  animations: buttonAnimations,
  standalone: false
})
export class MaterialButtonsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Button categories data
  categories = [
    {
      title: 'Basic Buttons',
      buttons: [
        { type: 'mat-button', color: 'primary', label: 'Primary', icon: '' },
        { type: 'mat-button', color: 'accent', label: 'Accent', icon: '' },
        { type: 'mat-button', color: 'warn', label: 'Warn', icon: '' },
        { type: 'mat-button', color: 'primary', label: 'With Icon', icon: 'thumb_up' }
      ]
    },
    {
      title: 'Raised Buttons',
      buttons: [
        { type: 'mat-raised-button', color: 'primary', label: 'Primary', icon: '' },
        { type: 'mat-raised-button', color: 'accent', label: 'Accent', icon: '' },
        { type: 'mat-raised-button', color: 'warn', label: 'Warn', icon: '' },
        { type: 'mat-raised-button', color: 'primary', label: 'With Icon', icon: 'favorite' }
      ]
    },
    {
      title: 'Stroked Buttons',
      buttons: [
        { type: 'mat-stroked-button', color: 'primary', label: 'Primary', icon: '' },
        { type: 'mat-stroked-button', color: 'accent', label: 'Accent', icon: '' },
        { type: 'mat-stroked-button', color: 'warn', label: 'Warn', icon: '' },
        { type: 'mat-stroked-button', color: 'primary', label: 'With Icon', icon: 'bookmark' }
      ]
    },
    {
      title: 'Flat Buttons',
      buttons: [
        { type: 'mat-flat-button', color: 'primary', label: 'Primary', icon: '' },
        { type: 'mat-flat-button', color: 'accent', label: 'Accent', icon: '' },
        { type: 'mat-flat-button', color: 'warn', label: 'Warn', icon: '' },
        { type: 'mat-flat-button', color: 'primary', label: 'With Icon', icon: 'done' }
      ]
    },
    {
      title: 'Icon Buttons',
      buttons: [
        { type: 'mat-icon-button', color: 'primary', label: '', icon: 'home' },
        { type: 'mat-icon-button', color: 'accent', label: '', icon: 'star' },
        { type: 'mat-icon-button', color: 'warn', label: '', icon: 'delete' },
        { type: 'mat-icon-button', color: '', label: '', icon: 'settings' }
      ]
    },
    {
      title: 'FAB Buttons',
      buttons: [
        { type: 'mat-fab', color: 'primary', label: '', icon: 'add' },
        { type: 'mat-fab', color: 'accent', label: '', icon: 'edit' },
        { type: 'mat-fab', color: 'warn', label: '', icon: 'delete' },
        { type: 'mat-mini-fab', color: 'primary', label: '', icon: 'navigation' }
      ]
    }
  ];

  // Pagination variables
  currentPage = 0;
  itemsPerPage = 3;
  totalPages = 0;
  paginatedCategories: any[] = [];
  
  // Search functionality
  searchTerm: string = '';
  filteredCategories: any[] = [];
  
  // Selected button for the interactive demo
  selectedButton: any = null;
  
  // Observer for scroll animations
  private observer: IntersectionObserver | null = null;

  constructor(private router: Router) {
    this.filteredCategories = [...this.categories];
  }

  ngOnInit() {
    this.calculateTotalPages();
    this.updatePaginatedCategories();
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

  navigateToAnimations() {
    this.router.navigateByUrl('/material-animations');
  }
  
  // Search functionality
  filterButtons() {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      
      this.filteredCategories = this.categories
        .map(category => {
          // Filter buttons within each category
          const filteredButtons = category.buttons.filter(button => 
            button.type.toLowerCase().includes(term) || 
            button.color?.toLowerCase().includes(term) || 
            button.label.toLowerCase().includes(term) || 
            button.icon.toLowerCase().includes(term)
          );
          
          // Return category with filtered buttons if any match
          if (filteredButtons.length > 0) {
            return { ...category, buttons: filteredButtons };
          }
          return null;
        })
        .filter(category => category !== null); // Filter out categories with no matching buttons
    }
    
    // Reset pagination
    this.currentPage = 0;
    this.calculateTotalPages();
    this.updatePaginatedCategories();
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.filterButtons();
  }
  
  // Show button in interactive demo
  showButtonDemo(button: any) {
    this.selectedButton = button;
    
    // Auto-dismiss after some time
    setTimeout(() => {
      if (this.selectedButton === button) {
        this.selectedButton = null;
      }
    }, 5000);
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
