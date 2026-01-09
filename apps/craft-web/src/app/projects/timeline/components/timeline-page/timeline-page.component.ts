import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TimelineEvent } from '../../models/timeline-event.model';
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
  private personFilter$ = new BehaviorSubject<'all' | 'raymond-sanford' | 'jeffrey-sanford'>('all');
  private typeFilter$ = new BehaviorSubject<'all' | 'professional' | 'technical' | 'personal' | 'historical' | 'education'>('all');
  selectedPerson: 'all' | 'raymond-sanford' | 'jeffrey-sanford' = 'all';
  selectedType: 'all' | 'professional' | 'technical' | 'personal' | 'historical' | 'education' = 'all';

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService, private cdr: ChangeDetectorRef) {
    this.timelineEvents$ = this.timelineService.events$ as Observable<TimelineEvent[]>;
    this.filteredEvents$ = combineLatest([this.timelineEvents$, this.personFilter$, this.typeFilter$]).pipe(
      map(([events, personFilter, typeFilter]) => {
        let filteredEvents = events;

        // Apply person filter
        if (personFilter !== 'all') {
          filteredEvents = filteredEvents.filter(
            event => (event.person ?? '').toLowerCase() === personFilter.toLowerCase(),
          );
        }

        // Apply type filter
        if (typeFilter !== 'all') {
          if (typeFilter === 'professional') {
            filteredEvents = filteredEvents.filter(event =>
              ['professional', 'project', 'timeline', 'family'].includes((event.type ?? '').toLowerCase()),
            );
          } else if (typeFilter === 'education') {
            filteredEvents = filteredEvents.filter(event => (event.type ?? '').toLowerCase() === 'education');
          } else if (typeFilter === 'technical') {
            filteredEvents = filteredEvents.filter(event => {
              const eventType = (event.type ?? '').toLowerCase();
              const title = (event.title ?? '').toLowerCase();
              const description = (event.description ?? '').toLowerCase();

              return (
                (eventType === 'personal' && title.includes('developer journal')) ||
                eventType === 'project' ||
                description.includes('angular') ||
                description.includes('typescript') ||
                description.includes('javascript') ||
                description.includes('react') ||
                description.includes('node') ||
                description.includes('java') ||
                description.includes('spring boot') ||
                description.includes('nestjs') ||
                description.includes('playwright') ||
                description.includes('tdd') ||
                description.includes('bdd') ||
                description.includes('kafka') ||
                description.includes('kubernetes') ||
                description.includes('oracle') ||
                description.includes('d3js') ||
                description.includes('material design') ||
                description.includes('rxjs') ||
                description.includes('sharepoint') ||
                description.includes('azure') ||
                description.includes('git') ||
                description.includes('agile') ||
                description.includes('scrum') ||
                description.includes('html5') ||
                description.includes('css3') ||
                description.includes('bootstrap') ||
                description.includes('wordpress') ||
                description.includes('jquery') ||
                description.includes('angularjs') ||
                description.includes('php') ||
                description.includes('codeigniter') ||
                description.includes('redis') ||
                description.includes('coldfusion') ||
                description.includes('phantomjs') ||
                description.includes('ruby') ||
                description.includes('less') ||
                description.includes('grunt') ||
                description.includes('mocha') ||
                description.includes('citrix') ||
                description.includes('lotus notes') ||
                description.includes('unix') ||
                description.includes('aix') ||
                description.includes('nt') ||
                description.includes('xdm') ||
                description.includes('cisco vpn') ||
                description.includes('remedy') ||
                description.includes('modem') ||
                description.includes('majordomo') ||
                description.includes('newsgroups') ||
                description.includes('radar') ||
                description.includes('icwar') ||
                description.includes('iphipar')
              );
            });
          } else if (typeFilter === 'personal') {
            filteredEvents = filteredEvents.filter(
              event => {
                const eventType = (event.type ?? '').toLowerCase();
                const title = (event.title ?? '').toLowerCase();

                return (
                  eventType === 'personal' ||
                  (eventType === 'historical' &&
                    (title.includes('early life') ||
                      title.includes('birth') ||
                      title.includes('passing') ||
                      title.includes('church') ||
                      title.includes('assembly of god')))
                );
              },
            );
          } else if (typeFilter === 'historical') {
            filteredEvents = filteredEvents.filter(event => (event.type ?? '').toLowerCase() === 'historical');
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
      const personLabel = this.selectedPerson !== 'all' ? this.selectedPerson : 'all people';
      console.log(`[TimelinePage] Raw timeline events received for ${personLabel}`, events?.length ?? 0, events);
    });

    // Debug: log filtered events after selections
    this.filteredEvents$.pipe(takeUntil(this.destroy$)).subscribe(events => {
      const personLabel = this.selectedPerson !== 'all' ? this.selectedPerson : 'all people';
      console.log(`[TimelinePage] Filtered timeline events for ${personLabel}`, events?.length ?? 0, events);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timelineService.disconnect();
  }

  onPersonFilterChange(person: 'all' | 'raymond-sanford' | 'jeffrey-sanford'): void {
    this.selectedPerson = person;
    this.personFilter$.next(person);
    this.refreshEvents();
  }

  onTypeFilterChange(type: 'all' | 'professional' | 'technical' | 'personal' | 'historical'): void {
    this.selectedType = type;
    this.typeFilter$.next(type);
    this.refreshEvents();
  }

  private refreshEvents(): void {
    if (this.selectedPerson === 'all') {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    const type = this.selectedType !== 'all' ? this.selectedType : undefined;

    this.loading = true;
    this.cdr.markForCheck();
    this.timelineService
      .loadInitialEvents(this.selectedPerson, type)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error loading timeline events:', error);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
