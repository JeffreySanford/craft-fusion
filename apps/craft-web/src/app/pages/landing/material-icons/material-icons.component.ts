import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { NgModel } from '@angular/forms';

// Animations for icons - Add default parameter
const iconAnimations = [
  trigger('iconAnimation', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('{{delay}}ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { params: { delay: 300 } }) // Add default value for the delay parameter
  ]),
  trigger('iconListAnimation', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger(30, [
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ]),
  trigger('iconPulse', [
    state('void', style({ transform: 'scale(1)' })),
    state('*', style({ transform: 'scale(1)' })),
    transition('* => *', [
      style({ transform: 'scale(1)' }),
      animate('500ms ease-in-out', style({ transform: 'scale(1.2)' })),
      animate('500ms ease-in-out', style({ transform: 'scale(1)' }))
    ])
  ]),
  trigger('fadeInOut', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ]),
    transition(':leave', [
      animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
    ])
  ])
];

@Component({
  selector: 'app-material-icons',
  templateUrl: './material-icons.component.html',
  styleUrls: ['./material-icons.component.scss'],
  animations: iconAnimations,
  standalone: false
})
export class MaterialIconsComponent implements OnInit, AfterViewInit, OnDestroy {
  materialIcons: string[] = [
    'home', 'person', 'settings', 'delete', 'favorite', 'star', 'check_circle', 
    'menu', 'close', 'search', 'add', 'remove', 'edit', 'share', 'cloud',
    'arrow_back', 'arrow_forward', 'refresh', 'mail', 'phone', 'notifications',
    'account_circle', 'folder', 'file_copy', 'more_vert', 'more_horiz',
    'visibility', 'visibility_off', 'lock', 'lock_open', 'shopping_cart',
    'local_offer', 'thumb_up', 'thumb_down', 'comment', 'chat', 'send',
    'attach_file', 'insert_photo', 'format_bold', 'format_italic',
    'format_align_left', 'format_align_center', 'format_align_right',
    'dashboard', 'data_usage', 'language', 'face', 'cake', 'public', 'school'
    // Add more icons as needed
  ];

  filteredIcons: string[] = [];
  searchTerm: string = '';
  showCopyNotification = false;
  copiedIcon = '';

  categories = [
    { name: 'Navigation', icons: ['home', 'menu', 'arrow_back', 'arrow_forward', 'close'] },
    { name: 'Actions', icons: ['edit', 'delete', 'add', 'remove', 'search'] },
    { name: 'Communication', icons: ['mail', 'phone', 'chat', 'comment', 'send'] },
    { name: 'User Interface', icons: ['visibility', 'visibility_off', 'more_vert', 'more_horiz'] }
    // Add more categories as needed
  ];

  // Pagination variables
  itemsPerPage = 36;
  currentPage = 0;
  totalPages = 0;
  paginatedIcons: string[] = [];
  
  // Observer for scroll animations
  private observer: IntersectionObserver | null = null;

  constructor(private router: Router) {
    this.filteredIcons = [...this.materialIcons];
  }

  ngOnInit() {
    this.calculateTotalPages();
    this.updatePaginatedIcons();
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
      this.itemsPerPage = 12;
    } else if (width < 960) {
      this.itemsPerPage = 24;
    } else {
      this.itemsPerPage = 36;
    }
    
    this.calculateTotalPages();
    this.updatePaginatedIcons();
  }

  calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredIcons.length / this.itemsPerPage);
  }

  updatePaginatedIcons() {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedIcons = this.filteredIcons.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePaginatedIcons();
      this.scrollToTop();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePaginatedIcons();
      this.scrollToTop();
    }
  }

  scrollToTop() {
    document.querySelector('.icons-container')?.scrollIntoView({ behavior: 'smooth' });
  }

  getTileClass(index: number): string {
    const classes = ['red-tile', 'blue-tile', 'white-tile'];
    return classes[index % classes.length];
  }
  
  navigateToButtons() {
    this.router.navigateByUrl('/material-buttons');
  }

  navigateToAnimations() {
    this.router.navigateByUrl('/material-animations');
  }
  
  // Drag and drop functionality
  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
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

  // New methods for search and copy functionality
  filterIcons() {
    if (!this.searchTerm.trim()) {
      this.filteredIcons = [...this.materialIcons];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredIcons = this.materialIcons.filter(icon => 
        icon.toLowerCase().includes(term)
      );
    }
    this.currentPage = 0;
    this.calculateTotalPages();
    this.updatePaginatedIcons();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterIcons();
  }

  copyIconName(iconName: string) {
    navigator.clipboard.writeText(iconName).then(() => {
      this.copiedIcon = iconName;
      this.showCopyNotification = true;
      
      setTimeout(() => {
        this.showCopyNotification = false;
      }, 2000);
    });
  }
}
