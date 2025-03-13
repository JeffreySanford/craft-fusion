// animations.ts
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

export const detailExpand = trigger('detailExpand', [
  state('collapsed', style({ 
    height: '0px', 
    minHeight: '0', 
    visibility: 'hidden', 
    opacity: '0',
    display: 'none' // Completely hide when collapsed
  })),
  state('expanded', style({ 
    height: '*', 
    visibility: 'visible', 
    opacity: '1',
    display: 'flex' // Show when expanded
  })),
  transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
]);

export const flyIn = trigger('flyIn', [
  transition(':enter', [
    animate('800ms cubic-bezier(0.215, 0.610, 0.355, 1.000)', 
      keyframes([
        style({ transform: 'translateX(-100%)', opacity: 0, offset: 0 }),
        style({ transform: 'translateX(15px)', opacity: 0.5, offset: 0.7 }),
        style({ transform: 'translateX(0)', opacity: 1, offset: 1.0 })
      ])
    )
  ]),
  transition(':leave', [
    animate('400ms ease-out', 
      keyframes([
        style({ transform: 'translateX(0)', opacity: 1, offset: 0 }),
        style({ transform: 'translateX(100%)', opacity: 0, offset: 1.0 })
      ])
    )
  ])
]);

// New patriotic flag wave animation for selected elements
export const flagWave = trigger('flagWave', [
  transition(':enter', [
    animate('1s ease-in-out', 
      keyframes([
        style({ transform: 'translateX(-10px) skewX(5deg)', offset: 0 }),
        style({ transform: 'translateX(8px) skewX(-4deg)', offset: 0.3 }),
        style({ transform: 'translateX(-6px) skewX(2deg)', offset: 0.6 }),
        style({ transform: 'translateX(0) skewX(0)', offset: 1 })
      ])
    )
  ])
]);