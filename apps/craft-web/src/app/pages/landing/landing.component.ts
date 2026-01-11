import { Component, OnInit, AfterViewInit, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { LoggerService } from '@craft-web/services/logger.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false,
})
export class LandingComponent implements OnInit, AfterViewInit {
  items = ['Architect', 'Developer', 'Designer'];
  @ViewChild('titleRef', { static: true }) titleRef!: ElementRef<HTMLElement>;

  constructor(private logger: LoggerService, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.logger.info('LandingComponent', 'LandingComponent initialized');
  }

  ngAfterViewInit(): void {
    // Split each word's text into per-letter spans and animate sequentially.
    const root = this.titleRef?.nativeElement ?? document;
    // query for `.word` inside the title root — when `root` is the title element
    // querying `.title .word` would return empty when `root` is already the `.title` node.
    const words = Array.from(root.querySelectorAll('.word')) as HTMLElement[];
    let globalDelay = 0;

    words.forEach((wordEl, wordIndex) => {
      const textEl = wordEl.querySelector('.word-text') as HTMLElement | null;
      if (!textEl) return;
      const text = textEl.textContent?.trim() || '';
      textEl.innerHTML = '';
      // Timing: make each word's full animation span exactly 3s.
      const wordTotal = 3; // seconds for the whole word
      const letterDuration = 0.9; // individual letter animation length (s)
      const letters = Math.max(1, text.length);
      const stagger = letters > 1 ? (wordTotal - letterDuration) / (letters - 1) : 0;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const span = this.renderer.createElement('span');
        this.renderer.addClass(span, 'char');
        this.renderer.setProperty(span, 'textContent', ch);
        const delay = globalDelay + i * stagger;
        // Prefer direct style.setProperty for CSS custom properties (more reliable at runtime)
        try {
          (span as HTMLElement).style.setProperty('--delay', `${delay}s`);
          (span as HTMLElement).style.setProperty('--duration', `${letterDuration}s`);
        } catch (e) {
          // fallback to Renderer2 if direct setProperty isn't allowed (very rare)
          try { this.renderer.setStyle(span, '--delay', `${delay}s`); } catch {}
          try { this.renderer.setStyle(span, '--duration', `${letterDuration}s`); } catch {}
        }
        // do not set animation-* inline; use CSS transitions driven by --delay/--duration
        this.renderer.appendChild(textEl, span);
      }

      // Debug: log the inline style and computed CSS custom properties for the first/last char
      try {
        const chars = Array.from(textEl.querySelectorAll('.char')) as HTMLElement[];
        if (chars.length) {
          const first = chars[0]!;
          const last = chars[chars.length - 1]!;
          this.logger.debug('Landing animation chars', {
            wordIndex,
            firstInline: first.style.cssText,
            lastInline: last.style.cssText,
            firstComputedDelay: getComputedStyle(first).getPropertyValue('--delay'),
            firstComputedDuration: getComputedStyle(first).getPropertyValue('--duration'),
            lastComputedDelay: getComputedStyle(last).getPropertyValue('--delay'),
            lastComputedDuration: getComputedStyle(last).getPropertyValue('--duration'),
          });
        }
      } catch (e) {
        // ignore logging errors
      }

      // increment globalDelay: word duration, plus 1s pause between words (except after last)
      globalDelay += wordTotal;
      if (wordIndex < words.length - 1) globalDelay += 1; // 1s pause between words
    });

    // after all letter animations, run scale pulse then set final outlined gold
    const totalDuration = globalDelay;
    // debug log to inspect computed timings
    try {
      this.logger.debug('Landing animation timing', { words: words.length, totalDuration });
    } catch (e) {
      // ignore if logger isn't available
    }

    setTimeout(() => {
      const titleEl = this.titleRef?.nativeElement ?? document.querySelector('.title');
      if (titleEl) this.renderer.addClass(titleEl, 'title-scale');
      setTimeout(() => {
        if (titleEl) this.renderer.removeClass(titleEl, 'title-scale');
        // finalize color/outline
        const container = this.titleRef?.nativeElement ?? document;
        const chars = Array.from(container.querySelectorAll('.char')) as HTMLElement[];
        chars.forEach(el => {
          this.renderer.setStyle(el, 'color', 'gold');
          this.renderer.setStyle(el, 'textShadow', '-1px -1px 0 #b8860b, 1px -1px 0 #b8860b, -1px 1px 0 #b8860b, 1px 1px 0 #b8860b');
        });
      }, 600);
    }, totalDuration * 1000);
  }
}
