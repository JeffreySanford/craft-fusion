import { Component, OnInit, OnDestroy } from '@angular/core';
import { TimelineService } from '../../services/timeline.service';
import { TimelineEvent } from '../../models/timeline-event.model';
import { Observable, Subscription, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-jeffrey-ai',
  templateUrl: './jeffrey-ai.component.html',
  styleUrls: ['./jeffrey-ai.component.scss']
  ,standalone: false
})
export class JeffreyAiComponent implements OnInit, OnDestroy {
  jeffreyEvents$: Observable<TimelineEvent[]>;
  private sub?: Subscription;
  narratives = new Map<string, string>();

  constructor(private timelineService: TimelineService, private http: HttpClient) {
    this.jeffreyEvents$ = this.timelineService.events$.pipe(
      map(events => (events || []).filter(e => e.title && e.title.toLowerCase().includes('jeffrey')))
    );
  }

  ngOnInit(): void {
    // Ensure initial load
    this.sub = this.timelineService.loadInitialEvents().subscribe(() => {
      // generate narratives after initial load
      this.regenerateNarratives();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  regenerateNarratives(): void {
    this.jeffreyEvents$.subscribe(events => {
      events.forEach(ev => {
        const key = ev.id || `${ev.title}-${ev.date}`;
        this.narratives.set(key, this.generateNarrative(ev));
      });
    }).unsubscribe();
  }

  async generateAiForEvent(ev: TimelineEvent) {
    const key = ev.id || `${ev.title}-${ev.date}`;
    const prompt = `Write a concise AI summary for this timeline entry titled "${ev.title}" dated ${ev.date}. Description: ${ev.description || ''}`;
    try {
      const res = await this.http.post<{ result: string }>('/api/internal/ai/generate', { prompt }).toPromise();
      if (res?.result) {
        this.narratives.set(key, res.result);
      }
    } catch (e) {
      this.narratives.set(key, 'AI generation failed.');
    }
  }

  private generateNarrative(ev: TimelineEvent): string {
    const when = (ev.date && new Date(ev.date).toLocaleDateString()) || 'an earlier time';
    const desc = ev.description ? `${ev.description}` : '';
    return `AI summary: "${ev.title}" — recorded ${when}. ${desc} This entry highlights key context and developer notes for the project.`;
  }
}
