import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const globalRippleConfig: RippleGlobalOptions = {
  disabled: false,
  animation: {
    enterDuration: 300,
    exitDuration: 150,
  },
};

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig }, provideAnimationsAsync()
  ]
}).catch(err => console.error(err));
