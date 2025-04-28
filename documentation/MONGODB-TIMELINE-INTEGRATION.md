# MongoDB Integration for Memorial Timeline

This document outlines the integration of MongoDB with the Memorial Timeline feature, focusing on real-time updates, schema design, and authentication.

## Table of Contents

1. [Pure RxJS State Management](#pure-rxjs-state-management)
2. [Static vs. Live Updates Strategy](#static-vs-live-updates-strategy)
3. [MongoDB Schema Design](#mongodb-schema-design)
4. [Socket-Driven Updates](#socket-driven-updates)
5. [Patriotic Theming](#patriotic-theming)
6. [Role-Based Access Control](#role-based-access-control)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Performance Considerations](#performance-considerations)

## Pure RxJS State Management

### Observable-First Approach

All data access in the Memorial Timeline feature follows these principles:

- **Promise to Observable Conversion**: All MongoDB/Mongoose operations are converted to Observables using RxJS operators:

```typescript
// Instead of using Promises directly:
// const events = await this.timelineEventModel.find().exec();

// Use Observable conversion:
import { from, defer } from 'rxjs';

// Method 1: Using defer for lazy execution
return defer(() => this.timelineEventModel.find().exec());

// Method 2: Using from for immediate execution
return from(this.timelineEventModel.find().exec());
```

- **Hot Observables in Services**: Services expose state via BehaviorSubject/ReplaySubject:

```typescript
@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private eventsSubject = new BehaviorSubject<TimelineEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();
  
  // Method to update events from MongoDB
  loadEvents(personId: string): Observable<TimelineEvent[]> {
    return this.http.get<TimelineEvent[]>(`${this.apiUrl}/persons/${personId}/events`).pipe(
      tap(events => this.eventsSubject.next(events)),
      catchError(error => {
        this.logger.error('Failed to load timeline events', error);
        return of([]);
      })
    );
  }
}
```

- **Async Pipe Binding**: Components never manually subscribe to observables:

```typescript
// timeline-page.component.ts
@Component({
  selector: 'app-timeline-page',
  template: `
    <div class="timeline-container">
      <app-timeline-list [events]="events$ | async"></app-timeline-list>
    </div>
  `
})
export class TimelinePageComponent {
  events$ = this.timelineService.events$;
  
  constructor(private timelineService: TimelineService) {
    this.timelineService.loadEvents(this.personId);
  }
}
```

## Static vs. Live Updates Strategy

The Memorial Timeline implements a hybrid data loading strategy combining REST and WebSockets:

### Initial Load via REST

```typescript
// Backend (NestJS)
@Controller('timeline')
export class TimelineController {
  @Get('events/:personId')
  getEventsByPerson(@Param('personId') personId: string): Observable<TimelineEvent[]> {
    return from(this.timelineService.findByPersonId(personId)).pipe(
      map(events => events.map(event => this.mapEventToDto(event)))
    );
  }
}

// Frontend (Angular)
loadInitialEvents(personId: string): Observable<TimelineEvent[]> {
  return this.http.get<TimelineEvent[]>(`${this.apiUrl}/timeline/events/${personId}`);
}
```

### Incremental Updates via WebSockets

```typescript
// Backend (NestJS)
@WebSocketGateway()
export class TimelineGateway {
  @WebSocketServer()
  server: Server;

  notifyNewEvent(event: TimelineEvent): void {
    this.server.emit(`timeline:events:${event.personId}`, event);
  }
}

// Frontend (Angular)
connectToEventUpdates(personId: string): Observable<TimelineEvent> {
  return this.socketClient.fromEvent<TimelineEvent>(`timeline:events:${personId}`);
}
```

### Combining Sources

```typescript
// In TimelineService
initialize(personId: string): Observable<TimelineEvent[]> {
  // First get initial state via REST
  const initialLoad$ = this.loadInitialEvents(personId);
  
  // Listen for socket updates
  const updates$ = this.connectToEventUpdates(personId);
  
  // Combine initial load with incremental updates
  return initialLoad$.pipe(
    switchMap(initialEvents => {
      // Store initial events
      this.eventsSubject.next(initialEvents);
      
      // Listen for incremental updates via socket
      return updates$.pipe(
        scan((events, newEvent) => {
          // Check if event already exists
          const index = events.findIndex(e => e.id === newEvent.id);
          if (index >= 0) {
            // Update existing event
            return [
              ...events.slice(0, index),
              newEvent,
              ...events.slice(index + 1)
            ];
          } else {
            // Add new event
            return [...events, newEvent];
          }
        }, initialEvents)
      );
    }),
    // Store each new state in the BehaviorSubject
    tap(events => this.eventsSubject.next(events))
  );
}
```

## MongoDB Schema Design

### Timeline Event Schema

```typescript
// MongoDB Schema (NestJS + Mongoose)
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum EventCategory {
  BIRTH = 'birth',
  DEATH = 'death',
  MARRIAGE = 'marriage',
  CAREER = 'career',
  MILITARY = 'military',
  ACHIEVEMENT = 'achievement',
  OTHER = 'other'
}

@Schema({ timestamps: true })
export class TimelineEvent extends Document {
  @Prop({ required: true, index: true })
  personId: string;
  
  @Prop({ required: true })
  title: string;
  
  @Prop({ required: true })
  description: string;
  
  @Prop({ required: true })
  eventDate: Date;
  
  @Prop({ enum: EventCategory, default: EventCategory.OTHER })
  category: EventCategory;
  
  @Prop()
  imageUrl?: string;
  
  @Prop()
  sourceUrl?: string;
  
  @Prop()
  location?: {
    name: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  
  @Prop()
  tags?: string[];
  
  @Prop()
  createdBy?: string;
  
  // Automatically added by { timestamps: true }
  // createdAt: Date
  // updatedAt: Date
}

export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);

// Add compound index for efficient querying
TimelineEventSchema.index({ personId: 1, eventDate: -1 });
```

### Interface for Timeline Event DTO

```typescript
// Shared interface (used by both frontend and backend)
export interface TimelineEventDto {
  id: string;
  personId: string;
  title: string;
  description: string;
  eventDate: Date | string;
  category: EventCategory;
  imageUrl?: string;
  sourceUrl?: string;
  location?: {
    name: string;
    coordinates?: [number, number];
  };
  tags?: string[];
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

## Socket-Driven Updates

### Backend Implementation

```typescript
// NestJS Service
@Injectable()
export class TimelineService {
  constructor(
    @InjectModel(TimelineEvent.name) 
    private timelineEventModel: Model<TimelineEvent>,
    private readonly timelineGateway: TimelineGateway,
    private readonly logger: LoggerService
  ) {}

  async createEvent(createEventDto: CreateTimelineEventDto): Promise<TimelineEvent> {
    try {
      // Create and save the new event
      const newEvent = new this.timelineEventModel(createEventDto);
      const savedEvent = await newEvent.save();
      
      // Emit the event through the WebSocket gateway
      this.timelineGateway.notifyNewEvent(this.mapToDto(savedEvent));
      
      this.logger.info(`Created and broadcast new timeline event: ${savedEvent.id}`);
      return savedEvent;
    } catch (error) {
      this.logger.error('Failed to create timeline event', error);
      throw error;
    }
  }
  
  // Helper to map Mongoose document to DTO
  private mapToDto(event: TimelineEvent): TimelineEventDto {
    return {
      id: event._id.toString(),
      personId: event.personId,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      category: event.category,
      imageUrl: event.imageUrl,
      sourceUrl: event.sourceUrl,
      location: event.location,
      tags: event.tags,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }
}
```

### Frontend Implementation

```typescript
// Angular Service
@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private eventsSubject = new BehaviorSubject<TimelineEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();
  private socket$: WebSocketSubject<any>;
  
  constructor(
    private http: HttpClient,
    private socketClient: SocketClientService,
    private logger: LoggerService
  ) {}
  
  connect(personId: string): void {
    // Initialize data flow
    this.loadInitialEvents(personId).pipe(
      // After initial load, set up socket connection for updates
      tap(initialEvents => {
        this.eventsSubject.next(initialEvents);
        this.setupSocketConnection(personId);
      }),
      catchError(error => {
        this.logger.error('Failed to load initial timeline events', error);
        return of([]);
      })
    ).subscribe();
  }
  
  private setupSocketConnection(personId: string): void {
    this.socketClient.on<TimelineEvent>(`timeline:events:${personId}`).pipe(
      tap(newEvent => {
        // Get current events
        const currentEvents = this.eventsSubject.value;
        
        // Check if event already exists (update) or is new
        const index = currentEvents.findIndex(e => e.id === newEvent.id);
        let updatedEvents: TimelineEvent[];
        
        if (index >= 0) {
          // Update existing event
          updatedEvents = [
            ...currentEvents.slice(0, index),
            newEvent,
            ...currentEvents.slice(index + 1)
          ];
        } else {
          // Add new event
          updatedEvents = [...currentEvents, newEvent];
          
          // Sort by date (newest events first)
          updatedEvents.sort((a, b) => 
            new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
          );
        }
        
        // Update state
        this.eventsSubject.next(updatedEvents);
      }),
      catchError(error => {
        this.logger.error('Socket event error', error);
        return EMPTY;
      })
    ).subscribe();
  }
  
  // Create a new event via API
  createEvent(event: Partial<TimelineEvent>): Observable<TimelineEvent> {
    return this.http.post<TimelineEvent>(`${this.apiUrl}/timeline/events`, event);
    // Note: No need to update local state here as it will come through socket
  }
}
```

## Patriotic Theming

### Dynamic Theme Control

```typescript
// timeline-item.component.ts
@Component({
  selector: 'app-timeline-item',
  templateUrl: './timeline-item.component.html',
  styleUrls: ['./timeline-item.component.scss']
})
export class TimelineItemComponent implements OnInit {
  @Input() event: TimelineEvent;
  @Input() person: Person;
  
  // Derived properties for theming
  isPatriotic = false;
  themeClass = '';
  
  ngOnInit(): void {
    this.determineTheme();
  }
  
  private determineTheme(): void {
    if (!this.person) return;
    
    // Apply patriotic theme for veterans, public servants, and notable figures
    if (
      this.person.categories?.includes('veteran') || 
      this.person.categories?.includes('public_servant') ||
      this.person.categories?.includes('notable_figure') ||
      this.person.names?.includes('Raymond Sanford') ||
      this.person.names?.includes('William Price')
    ) {
      this.isPatriotic = true;
      this.themeClass = 'patriotic-theme';
    }
  }
  
  getEventIconClass(): string {
    if (!this.event) return '';
    
    // Base icon class by category
    let iconClass = `event-icon-${this.event.category}`;
    
    // Add patriotic styling if appropriate
    if (this.isPatriotic) {
      iconClass += ' patriotic-icon';
    }
    
    return iconClass;
  }
}
```

### SCSS Implementation

```scss
// timeline-item.component.scss
@use 'styles/variables' as vars;
@use 'styles/mixins' as mix;

// Standard event styling
.timeline-event {
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  
  &__header {
    margin-bottom: 0.5rem;
  }
  
  &__title {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }
  
  &__date {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.9rem;
  }
  
  &__content {
    margin-bottom: 0.5rem;
  }
  
  &__footer {
    font-size: 0.8rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  
  // Base icon styles
  .event-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    
    &-birth { background-color: var(--md-sys-color-primary-container); }
    &-death { background-color: var(--md-sys-color-error-container); }
    &-marriage { background-color: var(--md-sys-color-tertiary-container); }
    &-career { background-color: var(--md-sys-color-secondary-container); }
    &-military { background-color: var(--md-sys-color-tertiary-container); }
    &-achievement { background-color: var(--md-sys-color-primary-container); }
    &-other { background-color: var(--md-sys-color-surface-variant); }
  }
}

// Patriotic theme enhancements
.patriotic-theme {
  // Special flag-inspired border
  border-left: 4px solid var(--md-sys-color-primary);
  position: relative;
  overflow: hidden;
  
  // Flag-inspired background gradient
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 40%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(191, 10, 48, 0.05),  // Red (BF0A30)
      rgba(0, 40, 104, 0.05),   // Navy (002868)
      rgba(255, 255, 255, 0.05) // White
    );
    z-index: 0;
    pointer-events: none;
  }
  
  // Gold accents
  .timeline-event {
    &__title {
      color: var(--md-sys-color-primary);
      text-shadow: 0 1px 2px rgba(255, 215, 0, 0.1); // Gold glow
    }
    
    &__footer {
      border-top: 1px solid rgba(255, 215, 0, 0.2); // Gold border
      padding-top: 0.5rem;
    }
  }
  
  // Enhanced icon styling for patriotic theme
  .patriotic-icon {
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.6); // Gold ring
    
    // Navy background for military events
    &.event-icon-military {
      background-color: #002868; // Navy
      color: #ffffff; // White
    }
    
    // Red background for achievement events
    &.event-icon-achievement {
      background-color: #BF0A30; // Red
      color: #ffffff; // White
    }
  }
}
```

## Role-Based Access Control

### Role Definition

```typescript
// In auth service or constants file
export enum UserRole {
  USER = 'user',
  FAMILY = 'family',
  ADMIN = 'admin'
}

export interface UserRoles {
  groups: UserRole[];
}
```

### Guard Implementation

```typescript
// family-role.guard.ts
@Injectable()
export class FamilyRoleGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        // Check if user has family role
        const hasFamilyRole = user?.roles?.groups?.includes(UserRole.FAMILY);
        
        if (!hasFamilyRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
```

### Route Configuration

```typescript
// app-routing.module.ts
const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  
  // Family-only routes
  { 
    path: 'family-portal', 
    canActivate: [AuthGuard, FamilyRoleGuard],
    loadChildren: () => import('./modules/family-portal/family-portal.module')
      .then(m => m.FamilyPortalModule)
  },
  
  // Timeline routes with conditional editing
  {
    path: 'timeline/:personId',
    component: TimelinePageComponent
  },
  
  // Adding new timeline events requires family role
  {
    path: 'timeline/:personId/add',
    component: TimelineEventFormComponent,
    canActivate: [AuthGuard, FamilyRoleGuard]
  }
];
```

### Conditional UI Elements

```typescript
// header.component.ts
@Component({
  selector: 'app-header',
  template: `
    <header class="app-header">
      <!-- Regular navigation items -->
      
      <!-- Only show Family Portal button to users with family role -->
      <a *ngIf="hasFamilyRole$ | async" 
         routerLink="/family-portal"
         class="family-portal-btn">
        Family Portal
      </a>
    </header>
  `
})
export class HeaderComponent {
  hasFamilyRole$: Observable<boolean>;
  
  constructor(private authService: AuthenticationService) {
    this.hasFamilyRole$ = this.authService.currentUser$.pipe(
      map(user => Boolean(user?.roles?.groups?.includes(UserRole.FAMILY)))
    );
  }
}
```

### API Authorization

```typescript
// NestJS backend
@Controller('timeline')
export class TimelineController {
  // Public endpoint - anyone can view timeline events
  @Get('events/:personId')
  getEventsByPerson(@Param('personId') personId: string): Observable<TimelineEvent[]> {
    return from(this.timelineService.findByPersonId(personId));
  }
  
  // Protected endpoint - only family members can add events
  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FAMILY)
  createEvent(
    @Body() createEventDto: CreateTimelineEventDto,
    @Request() req
  ): Observable<TimelineEvent> {
    // Add the current user as the creator
    createEventDto.createdBy = req.user.id;
    
    return from(this.timelineService.createEvent(createEventDto));
  }
}
```

## Implementation Guidelines

### MongoDB Connection

```typescript
// In NestJS module
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/craft-fusion', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    MongooseModule.forFeature([
      { name: TimelineEvent.name, schema: TimelineEventSchema }
    ])
  ],
  controllers: [TimelineController],
  providers: [TimelineService, TimelineGateway]
})
export class TimelineModule {}
```

### Error Handling Strategy

```typescript
// Angular service
private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    this.logger.error(`${operation} failed: ${error.message}`, error.stack);
    
    // Show user-friendly notification
    this.notificationService.showError(`Unable to ${operation.toLowerCase()}. Please try again later.`);
    
    // Return a safe result or re-throw based on context
    return result ? of(result) : throwError(() => error);
  };
}
```

### Unit Testing RxJS Streams

```typescript
// Example test for TimelineService
describe('TimelineService', () => {
  let service: TimelineService;
  let httpMock: HttpTestingController;
  let socketClientMock: any;
  
  beforeEach(() => {
    socketClientMock = {
      on: jasmine.createSpy('on').and.returnValue(EMPTY)
    };
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TimelineService,
        { provide: SocketClientService, useValue: socketClientMock },
        { provide: LoggerService, useValue: { error: jasmine.createSpy('error') } }
      ]
    });
    
    service = TestBed.inject(TimelineService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should load initial events and update eventsSubject', () => {
    const mockEvents = [{ id: '1', title: 'Test Event' }] as TimelineEvent[];
    
    // Subscribe to the observable to trigger the HTTP request
    let result: TimelineEvent[] | undefined;
    service.events$.subscribe(events => {
      result = events;
    });
    
    // Initially should be empty
    expect(result).toEqual([]);
    
    // Call service method
    service.loadInitialEvents('person1').subscribe();
    
    // Expect an HTTP request
    const req = httpMock.expectOne(`${service['apiUrl']}/timeline/events/person1`);
    expect(req.request.method).toBe('GET');
    
    // Respond with mock data
    req.flush(mockEvents);
    
    // Verify the BehaviorSubject was updated
    expect(result).toEqual(mockEvents);
  });
});
```

## Performance Considerations

### Pagination for Large Timelines

```typescript
// Backend controller
@Get('events/:personId')
getEventsByPerson(
  @Param('personId') personId: string,
  @Query('page') page = 1,
  @Query('limit') limit = 20
): Observable<{ events: TimelineEvent[], total: number }> {
  return from(this.timelineService.findByPersonId(personId, { page, limit }));
}

// Service implementation
findByPersonId(
  personId: string, 
  options: { page: number, limit: number }
): Promise<{ events: TimelineEvent[], total: number }> {
  const skip = (options.page - 1) * options.limit;
  
  return Promise.all([
    this.timelineEventModel
      .find({ personId })
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(options.limit)
      .exec(),
    this.timelineEventModel
      .countDocuments({ personId })
      .exec()
  ]).then(([events, total]) => ({ events, total }));
}
```

### Optimized Indexes for Common Queries

```typescript
// In schema definition
TimelineEventSchema.index({ personId: 1, eventDate: -1 }); // Compound index for efficient sorting
TimelineEventSchema.index({ category: 1 }); // For filtering by category
TimelineEventSchema.index({ eventDate: 1 }); // For date range queries
TimelineEventSchema.index({ tags: 1 }); // For tag-based queries
```

### Caching Strategy for Static Data

```typescript
// In Angular service
private eventCache = new Map<string, { timestamp: number, data: TimelineEvent[] }>();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

loadInitialEvents(personId: string): Observable<TimelineEvent[]> {
  // Check cache first
  const cached = this.eventCache.get(personId);
  if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
    return of(cached.data);
  }
  
  // If not cached or expired, fetch from API
  return this.http.get<TimelineEvent[]>(`${this.apiUrl}/timeline/events/${personId}`).pipe(
    tap(events => {
      // Update cache
      this.eventCache.set(personId, {
        timestamp: Date.now(),
        data: events
      });
    })
  );
}
```
