import { 
  trigger, 
  state, 
  style, 
  animate, 
  transition, 
  keyframes, 
  query, 
  stagger, 
  animation
} from '@angular/animations';

/**
 * Rotate animation for icons and other elements
 */
export const rotateAnimation = trigger('rotateAnimation', [
  state('static', style({ transform: 'rotate(0deg)' })),
  state('rotate', style({ transform: 'rotate(360deg)' })),
  transition('static => rotate', [
    animate('1000ms ease-out', keyframes([
      style({ transform: 'rotate(0deg)', offset: 0 }),
      style({ transform: 'rotate(360deg)', offset: 1 })
    ]))
  ]),
  transition('rotate => static', [
    animate('0ms')
  ])
]);

/**
 * Patriotic elements stagger animation
 */
export const patrioticElementsStagger = trigger('patrioticElementsStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger('100ms', [
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);
