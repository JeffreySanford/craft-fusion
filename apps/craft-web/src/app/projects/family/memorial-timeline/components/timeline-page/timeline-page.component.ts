import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TimelineEvent, TimelineEventType } from '../../models/timeline-event.model';
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'app-timeline-page',
  templateUrl: './timeline-page.component.html',
  styleUrls: ['./timeline-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TimelinePageComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  timelineEvents$: Observable<TimelineEvent[]>;
  filteredEvents$: Observable<TimelineEvent[]>;
  private personFilter$ = new BehaviorSubject<'all' | 'raymond-sanford' | 'jeffrey'>('all');
  private typeFilter$ = new BehaviorSubject<'all' | 'professional' | 'technical' | 'personal' | 'historical'>('all');
  selectedPerson: 'all' | 'raymond-sanford' | 'jeffrey' = 'all';
  selectedType: 'all' | 'professional' | 'technical' | 'personal' | 'historical' = 'all';

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService) {
    this.timelineEvents$ = this.timelineService.events$ as Observable<TimelineEvent[]>;
    this.filteredEvents$ = combineLatest([this.timelineEvents$, this.personFilter$, this.typeFilter$]).pipe(
      map(([events, personFilter, typeFilter]) => {
        let filteredEvents = events;

        // Apply person filter
        if (personFilter !== 'all') {
          if (personFilter === 'raymond-sanford') {
            filteredEvents = filteredEvents.filter(
              event =>
                event.title.toLowerCase().includes('raymond') ||
                event.title.toLowerCase().includes('ray ') ||
                event.title.toLowerCase().includes('ray sanford') ||
                event.title.toLowerCase().includes('sanford') ||
                event.description.toLowerCase().includes('raymond') ||
                event.description.toLowerCase().includes('ray ') ||
                event.description.toLowerCase().includes('ray sanford') ||
                event.description.toLowerCase().includes('sanford'),
            );
          } else if (personFilter === 'jeffrey') {
            filteredEvents = filteredEvents.filter(
              event =>
                event.title.toLowerCase().includes('jeffrey') || event.description.toLowerCase().includes('jeffrey') || event.title.toLowerCase().includes('developer journal'),
            );
          }
        }

        // Apply type filter
        if (typeFilter !== 'all') {
          if (typeFilter === 'professional') {
            filteredEvents = filteredEvents.filter(event => event.type === 'historical');
          } else if (typeFilter === 'technical') {
            filteredEvents = filteredEvents.filter(
              event =>
                (event.type === 'personal' && event.title.toLowerCase().includes('developer journal')) ||
                event.type === 'project' ||
                event.description.toLowerCase().includes('angular') ||
                event.description.toLowerCase().includes('typescript') ||
                event.description.toLowerCase().includes('javascript') ||
                event.description.toLowerCase().includes('react') ||
                event.description.toLowerCase().includes('node') ||
                event.description.toLowerCase().includes('java') ||
                event.description.toLowerCase().includes('spring boot') ||
                event.description.toLowerCase().includes('nestjs') ||
                event.description.toLowerCase().includes('playwright') ||
                event.description.toLowerCase().includes('tdd') ||
                event.description.toLowerCase().includes('bdd') ||
                event.description.toLowerCase().includes('kafka') ||
                event.description.toLowerCase().includes('kubernetes') ||
                event.description.toLowerCase().includes('oracle') ||
                event.description.toLowerCase().includes('d3js') ||
                event.description.toLowerCase().includes('material design') ||
                event.description.toLowerCase().includes('rxjs') ||
                event.description.toLowerCase().includes('sharepoint') ||
                event.description.toLowerCase().includes('azure') ||
                event.description.toLowerCase().includes('git') ||
                event.description.toLowerCase().includes('agile') ||
                event.description.toLowerCase().includes('scrum') ||
                event.description.toLowerCase().includes('html5') ||
                event.description.toLowerCase().includes('css3') ||
                event.description.toLowerCase().includes('bootstrap') ||
                event.description.toLowerCase().includes('wordpress') ||
                event.description.toLowerCase().includes('jquery') ||
                event.description.toLowerCase().includes('angularjs') ||
                event.description.toLowerCase().includes('php') ||
                event.description.toLowerCase().includes('codeigniter') ||
                event.description.toLowerCase().includes('redis') ||
                event.description.toLowerCase().includes('coldfusion') ||
                event.description.toLowerCase().includes('phantomjs') ||
                event.description.toLowerCase().includes('ruby') ||
                event.description.toLowerCase().includes('less') ||
                event.description.toLowerCase().includes('grunt') ||
                event.description.toLowerCase().includes('mocha') ||
                event.description.toLowerCase().includes('citrix') ||
                event.description.toLowerCase().includes('lotus notes') ||
                event.description.toLowerCase().includes('unix') ||
                event.description.toLowerCase().includes('aix') ||
                event.description.toLowerCase().includes('nt') ||
                event.description.toLowerCase().includes('xdm') ||
                event.description.toLowerCase().includes('cisco vpn') ||
                event.description.toLowerCase().includes('remedy') ||
                event.description.toLowerCase().includes('modem') ||
                event.description.toLowerCase().includes('majordomo') ||
                event.description.toLowerCase().includes('newsgroups') ||
                event.description.toLowerCase().includes('radar') ||
                event.description.toLowerCase().includes('icwar') ||
                event.description.toLowerCase().includes('iphipar'),
            );
          } else if (typeFilter === 'personal') {
            filteredEvents = filteredEvents.filter(
              event =>
                event.type === 'personal' ||
                (event.type === 'historical' &&
                  (event.title.toLowerCase().includes('early life') ||
                    event.title.toLowerCase().includes('birth') ||
                    event.title.toLowerCase().includes('passing') ||
                    event.title.toLowerCase().includes('church') ||
                    event.title.toLowerCase().includes('assembly of god'))),
            );
          } else if (typeFilter === 'historical') {
            filteredEvents = filteredEvents.filter(event => event.type === 'historical');
          }
        }

        return filteredEvents;
      }),
    );
  }

  ngOnInit(): void {
    this.timelineService.connect();

    // Debug: log incoming raw events
    this.timelineEvents$.pipe(takeUntil(this.destroy$)).subscribe(events => {
      console.log('[TimelinePage] Raw timeline events received', events?.length ?? 0, events);
    });

    // Debug: log filtered events after selections
    this.filteredEvents$.pipe(takeUntil(this.destroy$)).subscribe(events => {
      console.log('[TimelinePage] Filtered timeline events', events?.length ?? 0, events);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timelineService.disconnect();
  }

  onPersonFilterChange(person: 'all' | 'raymond-sanford' | 'jeffrey'): void {
    this.selectedPerson = person;
    this.personFilter$.next(person);
    this.loadEvents();
  }

  onTypeFilterChange(type: 'all' | 'professional' | 'technical' | 'personal' | 'historical'): void {
    this.selectedType = type;
    this.typeFilter$.next(type);
    this.loadEvents();
  }

  private loadEvents(): void {
    if (this.loading) return;
    if (this.selectedPerson === 'all' || this.selectedType === 'all') {
      return;
    }

    this.loading = true;
    this.timelineService
      .loadInitialEvents(this.selectedPerson, this.selectedType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: error => {
          console.error('Error loading timeline events:', error);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
