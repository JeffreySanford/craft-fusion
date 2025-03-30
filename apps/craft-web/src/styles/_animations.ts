import { trigger, state, style, animate, transition, keyframes } from '@angular/animations';

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

// ...existing animations...
