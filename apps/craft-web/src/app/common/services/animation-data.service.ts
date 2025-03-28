import { Injectable } from '@angular/core';

/**
 * Interface for an animation example
 */
export interface AnimationExample {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  type: string;
  icon?: string;
  code: string;
  defaultState?: string;
}

/**
 * Interface for an animation category
 */
export interface AnimationCategory {
  id: string;
  name: string;
  description: string;
  examples: AnimationExample[];
}

/**
 * Service that provides animation data for the Material Animations component
 */
@Injectable({
  providedIn: 'root'
})
export class AnimationDataService {
  private animationCategories: AnimationCategory[] = [
    {
      id: 'basic',
      name: 'Basic Animations',
      description: 'Simple animations for common use cases',
      examples: [
        {
          id: 'fade-in-out',
          name: 'Fade In/Out',
          description: 'Smoothly transition an element\'s opacity to show or hide it.',
          shortDescription: 'Transition element opacity for visibility.',
          type: 'fade',
          icon: 'opacity',
          code: `trigger('fadeInOut', [
  state('in', style({ opacity: 1 })),
  state('out', style({ opacity: 0 })),
  transition('in => out', animate('400ms ease-out')),
  transition('out => in', animate('400ms ease-in'))
])`,
          defaultState: 'in'
        },
        {
          id: 'slide-in-out',
          name: 'Slide In/Out',
          description: 'Animate an element sliding in or out of view.',
          shortDescription: 'Slide elements in and out of view.',
          type: 'slide',
          icon: 'swap_horiz',
          code: `trigger('slideInOut', [
  state('in', style({ transform: 'translateX(0)' })),
  state('out', style({ transform: 'translateX(-100%)' })),
  transition('in => out', animate('400ms ease-out')),
  transition('out => in', animate('400ms ease-in'))
])`,
          defaultState: 'in'
        },
        {
          id: 'expand-collapse',
          name: 'Expand/Collapse',
          description: 'Expand or collapse an element smoothly, useful for accordions and dropdowns.',
          shortDescription: 'Expand or collapse elements smoothly.',
          type: 'expand',
          icon: 'unfold_more',
          code: `trigger('expandCollapse', [
  state('expanded', style({ height: '*', opacity: 1 })),
  state('collapsed', style({ height: '0px', opacity: 0 })),
  transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
])`,
          defaultState: 'expanded'
        }
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced Animations',
      description: 'More complex animations for richer user experiences',
      examples: [
        {
          id: 'stagger-list',
          name: 'Staggered List',
          description: 'Animate list items with a staggered delay for a cascade effect.',
          shortDescription: 'Create cascade effects for lists.',
          type: 'list',
          icon: 'format_list_bulleted',
          code: `trigger('listAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, height: 0 }),
      stagger(100, [
        animate('300ms ease-out', style({ opacity: 1, height: '*' }))
      ])
    ], { optional: true })
  ])
])`,
          defaultState: 'default'
        },
        {
          id: 'route-transition',
          name: 'Route Transition',
          description: 'Smooth transitions between routes to improve navigation experience.',
          shortDescription: 'Animate between route changes.',
          type: 'route',
          icon: 'alt_route',
          code: `trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    query(':leave', [animate('300ms ease-out', style({ opacity: 0 }))], { optional: true }),
    query(':enter', [animate('300ms ease-out', style({ opacity: 1 }))], { optional: true })
  ])
])`,
          defaultState: 'default'
        },
        {
          id: 'rotate-scale',
          name: 'Rotate & Scale',
          description: 'Combine rotation and scaling for attention-grabbing effects.',
          shortDescription: 'Combine rotation and scaling effects.',
          type: 'rotate',
          icon: '3d_rotation',
          code: `trigger('rotateScale', [
  state('normal', style({ transform: 'rotate(0) scale(1)' })),
  state('rotated', style({ transform: 'rotate(360deg) scale(1.5)' })),
  transition('normal <=> rotated', animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
])`,
          defaultState: 'normal'
        }
      ]
    },
    {
      id: 'keyframes',
      name: 'Keyframe Animations',
      description: 'Complex multi-step animations using keyframes',
      examples: [
        {
          id: 'bounce',
          name: 'Bounce',
          description: 'Create a bouncing effect for playful interactions.',
          shortDescription: 'Add bouncy, playful interactions.',
          type: 'keyframe',
          icon: 'moving',
          code: `trigger('bounce', [
  transition('* => *', [
    animate('1s', keyframes([
      style({ transform: 'translateY(0)', offset: 0 }),
      style({ transform: 'translateY(-20px)', offset: 0.3 }),
      style({ transform: 'translateY(0)', offset: 0.6 }),
      style({ transform: 'translateY(-10px)', offset: 0.8 }),
      style({ transform: 'translateY(0)', offset: 1 })
    ]))
  ])
])`,
          defaultState: 'default'
        },
        {
          id: 'pulse',
          name: 'Pulse',
          description: 'Create a pulsing effect to draw attention to an element.',
          shortDescription: 'Pulse to attract attention.',
          type: 'keyframe',
          icon: 'favorite',
          code: `trigger('pulse', [
  transition('* => *', [
    animate('1s', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.1)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 })
    ]))
  ])
])`,
          defaultState: 'default'
        },
        {
          id: 'shake',
          name: 'Shake',
          description: 'Create a shake effect for error states or attention.',
          shortDescription: 'Shake for errors or alerts.',
          type: 'keyframe',
          icon: 'vibration',
          code: `trigger('shake', [
  transition('* => *', [
    animate('0.5s', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.1 }),
      style({ transform: 'translateX(10px)', offset: 0.3 }),
      style({ transform: 'translateX(-10px)', offset: 0.5 }),
      style({ transform: 'translateX(10px)', offset: 0.7 }),
      style({ transform: 'translateX(-10px)', offset: 0.9 }),
      style({ transform: 'translateX(0)', offset: 1 })
    ]))
  ])
])`,
          defaultState: 'default'
        }
      ]
    },
    {
      id: 'group',
      name: 'Group Animations',
      description: 'Animations that coordinate multiple elements or properties',
      examples: [
        {
          id: 'card-flip',
          name: 'Card Flip',
          description: 'Create a 3D card flipping effect with front and back sides.',
          shortDescription: 'Flip cards in 3D space.',
          type: 'group',
          icon: 'flip',
          code: `trigger('cardFlip', [
  state('front', style({ transform: 'rotateY(0)' })),
  state('back', style({ transform: 'rotateY(180deg)' })),
  transition('front <=> back', [
    animate('500ms ease-out')
  ])
])`,
          defaultState: 'front'
        },
        {
          id: 'ripple',
          name: 'Ripple Effect',
          description: 'Create a material design ripple effect for clicks.',
          shortDescription: 'Material design click ripples.',
          type: 'group',
          icon: 'water_drop',
          code: `@Component({
  ...
  host: {
    '(click)': 'triggerRipple($event)'
  }
})
export class RippleComponent {
  triggerRipple(event: MouseEvent) {
    const ripple = document.createElement('span');
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size/2;
    const y = event.clientY - rect.top - size/2;
    
    ripple.style.cssText = \`
      position: absolute;
      width: \${size}px;
      height: \${size}px;
      top: \${y}px;
      left: \${x}px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    \`;
    
    this.elementRef.nativeElement.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}`,
          defaultState: 'default'
        },
        {
          id: 'parallel',
          name: 'Parallel Animations',
          description: 'Run multiple animations in parallel for complex effects.',
          shortDescription: 'Coordinate complex, parallel animations.',
          type: 'group',
          icon: 'view_carousel',
          code: `trigger('parallels', [
  transition('* => *', [
    group([
      query('.item1', [
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      query('.item2', [
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      query('.item3', [
        animate('1000ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ])
])`,
          defaultState: 'default'
        }
      ]
    },
    {
      id: 'patriotic',
      name: 'Patriotic Animations',
      description: 'Special animations that complement our patriotic theme',
      examples: [
        {
          id: 'flag-wave',
          name: 'Flag Wave',
          description: 'Create a waving flag effect with pure CSS animation.',
          shortDescription: 'Animated waving flag effect.',
          type: 'patriotic',
          icon: 'flag',
          code: `@keyframes flagWave {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

.flag {
  transform-origin: left;
  animation: flagWave 3s ease-in-out infinite;
}`,
          defaultState: 'default'
        },
        {
          id: 'star-twinkle',
          name: 'Star Twinkle',
          description: 'Create a twinkling star effect for patriotic elements.',
          shortDescription: 'Twinkling star animations.',
          type: 'patriotic',
          icon: 'star',
          code: `@keyframes starTwinkle {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.star {
  animation: starTwinkle 2s ease-in-out infinite;
}

// Create staggered effect for multiple stars
.stars-container .star:nth-child(1) { animation-delay: 0s; }
.stars-container .star:nth-child(2) { animation-delay: 0.5s; }
.stars-container .star:nth-child(3) { animation-delay: 1s; }`,
          defaultState: 'default'
        },
        {
          id: 'eagle-soar',
          name: 'Eagle Soar',
          description: 'Create a soaring eagle animation for powerful transitions.',
          shortDescription: 'Dramatic eagle flight animations.',
          type: 'patriotic',
          icon: 'flight',
          code: `@keyframes eagleSoar {
  0% { 
    transform: translateY(20px) translateX(-100%) scale(0.5); 
    opacity: 0; 
  }
  30% { 
    transform: translateY(-20px) translateX(-30%) scale(0.8);
    opacity: 1; 
  }
  70% { 
    transform: translateY(-40px) translateX(30%) scale(0.9); 
    opacity: 1;
  }
  100% { 
    transform: translateY(0) translateX(100%) scale(0.5); 
    opacity: 0;
  }
}

.eagle {
  animation: eagleSoar 4s ease-in-out;
}`,
          defaultState: 'default'
        }
      ]
    }
  ];

  constructor() { }

  /**
   * Get all animation categories
   * @returns Array of animation categories with their examples
   */
  getAnimationCategories(): AnimationCategory[] {
    return this.animationCategories;
  }

  /**
   * Get a specific animation category by ID
   * @param id The category ID to find
   * @returns The animation category or undefined if not found
   */
  getAnimationCategory(id: string): AnimationCategory | undefined {
    return this.animationCategories.find(category => category.id === id);
  }

  /**
   * Get a specific animation example by ID
   * @param id The example ID to find
   * @returns The animation example or undefined if not found
   */
  getAnimationExample(id: string): AnimationExample | undefined {
    for (const category of this.animationCategories) {
      const example = category.examples.find(ex => ex.id === id);
      if (example) {
        return example;
      }
    }
    return undefined;
  }

  /**
   * Search for animations by search term
   * @param term The search term
   * @returns Array of matching animation examples
   */
  searchAnimations(term: string): AnimationExample[] {
    const results: AnimationExample[] = [];
    const searchTerm = term.toLowerCase();

    this.animationCategories.forEach(category => {
      category.examples.forEach(example => {
        if (
          example.name.toLowerCase().includes(searchTerm) ||
          example.description.toLowerCase().includes(searchTerm) ||
          example.type.toLowerCase().includes(searchTerm) ||
          (example.shortDescription && example.shortDescription.toLowerCase().includes(searchTerm))
        ) {
          results.push(example);
        }
      });
    });

    return results;
  }
}
