import { Component, OnInit, AfterViewInit, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: false,
})
export class LandingComponent implements OnInit, AfterViewInit {
  items = ['Architect', 'Developer', 'Designer'];
  itemDelayBase = 0;
  itemStagger = 0.35;
  sectionDelay = 0;
  private readonly wordTotal = 0.9;
  private readonly wordPause = 0.25;
  private readonly letterDuration = 0.075; // Twice as fast (was 0.15)
  private readonly letterPause = 0.015; // Twice as fast (was 0.03)
  private readonly fireworkDelay = 0.3;
  private readonly initialWordDelay = 2;
  @ViewChild('titleRef', { static: true }) titleRef!: ElementRef<HTMLElement>;

  constructor(private logger: LoggerService, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.logger.info('LandingComponent', 'LandingComponent initialized');
    const wordCount = this.getWordCount();
    const totalDuration = wordCount ? wordCount * this.wordTotal + Math.max(0, wordCount - 1) * this.wordPause + this.initialWordDelay : 0;
    const sectionDelay = totalDuration + this.fireworkDelay;
    this.sectionDelay = sectionDelay;
    this.itemDelayBase = sectionDelay;
  }

  ngAfterViewInit(): void {
    const root = this.titleRef?.nativeElement ?? document;
    const words = Array.from(root.querySelectorAll('.word')) as HTMLElement[];
    let globalDelay = this.initialWordDelay;

    words.forEach((wordEl, wordIndex) => {
      const textEl = wordEl.querySelector('.word-text') as HTMLElement | null;
      if (!textEl) return;
      const text = textEl.textContent?.trim() || '';
      textEl.innerHTML = '';
      const letterDuration = this.letterDuration;
      const letterPause = this.letterPause;
      const letters = text.length;

      for (let i = 0; i < letters; i++) {
        const ch = text.charAt(i);
        const span = this.renderer.createElement('span');
        this.renderer.addClass(span, 'char');
        this.renderer.setProperty(span, 'textContent', ch);
        const delay = globalDelay + i * (letterDuration + letterPause);
        try {
          (span as HTMLElement).style.setProperty('--delay', `${delay}s`);
          (span as HTMLElement).style.setProperty('--duration', `${letterDuration}s`);
        } catch {
          try { this.renderer.setStyle(span, '--delay', `${delay}s`); } catch {}
          try { this.renderer.setStyle(span, '--duration', `${letterDuration}s`); } catch {}
        }
        this.renderer.appendChild(textEl, span);
      }

      // Total time for this word = last letter delay + letter duration
      globalDelay += (letters - 1) * (letterDuration + letterPause) + letterDuration;
      if (wordIndex < words.length - 1) globalDelay += this.wordPause;
    });

    const totalDuration = globalDelay;
    setTimeout(() => {
      const titleEl = this.titleRef?.nativeElement ?? document.querySelector('.title');
      if (titleEl) this.renderer.addClass(titleEl, 'title-scale');
      setTimeout(() => {
        if (titleEl) this.renderer.removeClass(titleEl, 'title-scale');
        const container = this.titleRef?.nativeElement ?? document;
        const chars = Array.from(container.querySelectorAll('.char')) as HTMLElement[];
        chars.forEach(el => {
          this.renderer.setStyle(el, 'color', 'gold');
          this.renderer.setStyle(el, 'textShadow', '-1px -1px 0 #b8860b, 1px -1px 0 #b8860b, -1px 1px 0 #b8860b, 1px 1px 0 #b8860b');
        });
        this.launchFireworks();
      }, this.fireworkDelay * 1000);
    }, totalDuration * 1000);
  }

  private getWordCount(): number {
    const root = this.titleRef?.nativeElement;
    if (!root) return 0;
    return root.querySelectorAll('.word').length;
  }

  private launchFireworks() {
    const root = this.titleRef?.nativeElement;
    if (!root) return;
    const words = Array.from(root.querySelectorAll('.word')) as HTMLElement[];
    if (!words.length) return;

    const palette = ['#ffcc01', '#e40032', '#00a3ff', '#ff6b00', '#a855f7', '#00e676', '#ffea00', '#ff3b30'];
    words.forEach(wordEl => {
      const textEl = wordEl.querySelector('.word-text') as HTMLElement | null;
      const chars = textEl ? Array.from(textEl.querySelectorAll('.char')) as HTMLElement[] : [];
      const anchorEl = chars.length ? chars[chars.length - 1] : wordEl;
      const existing = wordEl.querySelector('.firework-burst') as HTMLElement | null;
      if (existing && existing.parentNode) {
        try { this.renderer.removeChild(existing.parentNode, existing); } catch {}
      }
      const burst = this.renderer.createElement('span');
      this.renderer.addClass(burst, 'firework-burst');
      this.renderer.setAttribute(burst, 'aria-hidden', 'true');

      this.renderer.addClass(anchorEl, 'firework-anchor');

      const particleCount = 44;
      for (let i = 0; i < particleCount; i++) {
        const particle = this.renderer.createElement('span');
        this.renderer.addClass(particle, 'firework-particle');
        const color = palette[Math.floor(Math.random() * palette.length)]!;
        const x = (10 + Math.random() * 10).toFixed(2);
        const y = (-10 - Math.random() * 10).toFixed(2);
        const delay = (Math.random() * 0.5).toFixed(2);
        const duration = (1.6 + Math.random() * 1.6).toFixed(2);

        const particleEl = particle as HTMLElement;
        particleEl.style.setProperty('--fw-color', color);
        particleEl.style.setProperty('--fw-x', `${x}em`);
        particleEl.style.setProperty('--fw-y', `${y}em`);
        particleEl.style.setProperty('--fw-delay', `${delay}s`);
        particleEl.style.setProperty('--fw-duration', `${duration}s`);
        this.renderer.appendChild(burst, particle);
      }

      this.renderer.appendChild(anchorEl, burst);

      setTimeout(() => {
        try { this.renderer.removeChild(anchorEl, burst); } catch {}
      }, 4200);
    });
  }

}
