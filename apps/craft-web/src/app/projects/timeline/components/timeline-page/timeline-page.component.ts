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
              ['professional', 'project', 'timeline', 'family'].includes(event.type ?? ''),
            );
          } else if (typeFilter === 'education') {
            filteredEvents = filteredEvents.filter(event => event.type === 'education');
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
