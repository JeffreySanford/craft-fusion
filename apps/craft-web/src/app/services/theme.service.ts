import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeName = 'vibrant-theme' | 'light-theme' | 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themes: ThemeName[] = ['vibrant-theme', 'light-theme', 'dark-theme'];
  private current$ = new BehaviorSubject<ThemeName>('vibrant-theme');
  public currentTheme$ = this.current$.asObservable();

  constructor() {
    try {
      const stored = localStorage.getItem('app-theme') as ThemeName | null;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial: ThemeName = (stored as ThemeName) ?? (prefersDark ? 'dark-theme' : 'vibrant-theme');
      this.setTheme(initial);
    } catch {
      this.setTheme('vibrant-theme');
    }
  }

  setTheme(theme: ThemeName) {
    this.current$.next(theme);
    this.applyBodyClass(theme);
    try {
      localStorage.setItem('app-theme', theme);
    } catch {

    }
  }

  cycleTheme() {
    const idx = this.themes.indexOf(this.current$.value);
    const next = this.themes[(idx + 1) % this.themes.length]!;
    this.setTheme(next);
  }

  private applyBodyClass(theme: ThemeName) {
    if (typeof document === 'undefined') return;
    const body = document.body;
    this.themes.forEach(t => body.classList.remove(t));
    body.classList.add(theme);
  }
}
