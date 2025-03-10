import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KatexComponent } from './katex.component';
import { KatexDirective } from './katex.directive';

@NgModule({
  declarations: [
    KatexComponent,
    KatexDirective
  ],
  imports: [CommonModule],
  exports: [
    KatexComponent,
    KatexDirective
  ]
})
export class KatexModule {
  constructor() {
    // Ensure KaTeX CSS is loaded
    this.loadKatexStyles();
  }

  private loadKatexStyles(): void {
    // Add KaTeX CSS if not already added
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }
}
