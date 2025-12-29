# State Management

State management in Craft Web utilizes RxJS `BehaviorSubject`s within dedicated services to hold and expose different pieces of application state. This follows principles similar to Ward Bell's state mechanism and Dan Wahlin's RxJS state methodology.

## Core Principles

* **Centralized State:** State is held within specific services (e.g., `UserStateService`, `AdminStateService`, `ThemeService`).
* **Immutability (Implied):** While not strictly enforced by interfaces, updates should ideally treat state as immutable, creating new state objects/values rather than modifying existing ones directly (e.g., using spread syntax `{ ...currentState, ...update }`).
* **Observable Streams:** State is exposed via RxJS `Observable`s (usually derived from `BehaviorSubject.asObservable()`). Components subscribe to these streams to react to state changes.
* **Action Methods:** Services provide methods to update the state (e.g., `setAdminStatus`, `setCollapsed`), which in turn emit new values on the observable streams.

## Key State Services

### UserStateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\user-state.service.ts`)

Manages state specific to the logged-in user's session and preferences. *Note: Seems focused on user activity/preferences rather than core user identity, which is in `AuthenticationService`.*

* **State Properties (Internal):**
  * `openedDocuments`: Array of `Document` objects (`{ name: string, color: string }`).
  * `loginDateTime`: `Date | null`.
  * `visitLength`: `number | null`.
  * `visitedPages`: `string[]`.
* **Persistence:** Interacts with the backend API (`ApiService` and `HttpClient`) to save and load user state via specific endpoints (`/api/user/saveStateData`, `/api/user/loadStateData`, `/api/user/loadUserState`, `/api/user/setUserState`, `/api/files/saveOpenedDocuments`, `/api/files/getOpenedDocuments`, etc.). Uses `ImportedUserState` interface.
* **Methods:** Provides methods to get/set opened documents (`setOpenedDocument`, `setOpenedDocuments`, `getOpenedDocuments`), login time (`setLoginDateTime`, `getLoginDateTime`), visit length (`setVisitLength`, `getVisitLength`), and visited pages (`setVisitedPage`, `getVisitedPages`). Also includes `getCurrentUser` and `getAllUsers` methods interacting with `/users` endpoints.
* **Debouncing:** Uses `debounceTime` (`DEBOUNCE_TIME`) on a `Subject` (`visitLengthSubject`) for saving `visitLength` updates to avoid excessive API calls.
* **Error Handling:** Basic `catchError` using a private `handleError` method.

### AdminStateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\admin-state.service.ts`)

Manages state related to administrative functions and table performance monitoring.

* **State Properties:**
  * `isAdmin$`: Observable boolean indicating if the current user has admin privileges (set via `setAdminStatus`).
  * `tableLoadingState$`: Observable `TableLoadingState` object tracking the progress, record counts, and status of large table data loading operations (updated via `updateTableLoadingState`, `resetTableLoadingState`).
  * `tableMemoryUsage$`: Observable number tracking estimated memory usage (in MB) for table components (updated via `updateTableMemoryUsage`).
* **Methods:** Provides methods to get/set admin status (`setAdminStatus`, `getAdminStatus`), get/update/reset table loading state, get/update table memory usage. Includes `prepareTableCleanup` to reset state, intended for use when navigating away from the table component.
* **Logging:** Integrates with `LoggerService` to log state changes and warnings (e.g., high memory usage).

### SidebarStateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\sidebar-state.service.ts`)

Manages the collapsed/expanded state of the main sidebar.

* **State Property:** `isCollapsed$`: Observable boolean.
* **Methods:** `setCollapsed()`, `toggleSidebar()`, `get isCollapsed` (getter).

### FooterStateService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\footer-state.service.ts`)

Manages the expanded/collapsed state of the application footer.

* **State Property:** `expanded$`: Observable boolean.
* **Method:** `setExpanded()`.

### ThemeService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\theme.service.ts`)

Manages the application's theme (light/dark).

* **State Property:** `isDarkTheme$`: Observable boolean.
* **Persistence:** Reads initial theme from `localStorage` ('theme' key) or system preference (`prefers-color-scheme`) and saves changes to `localStorage`.
* **Method:** `toggleTheme()`. Applies/removes `dark-theme`/`light-theme` classes on `document.body`.

### UserTrackingService

(`c:\repos\craft-fusion\apps\craft-web\src\app\common\services\user-tracking.service.ts`)

A simple service to hold the current application user (`AppUser` interface).

* **State Property:** `currentUserSubject`: BehaviorSubject holding `AppUser | null`. Exposed via `getCurrentUser()`.
* **Method:** `setCurrentUser()`.
*(Note: Significant overlap with `AuthenticationService.currentUser$`. Consider consolidating or clarifying purpose).*

## Real-Time State Updates with Socket.IO

Craft Fusion implements a hybrid state management approach that combines traditional HTTP requests with Socket.IO for real-time updates.

### Socket-Driven State Updates

For certain high-frequency data types, we use Socket.IO to push state updates directly from the backend:

1. **Initial State Loading**: State is initialized via traditional REST API calls
2. **Incremental Updates**: Delta updates are pushed via Socket.IO when data changes
3. **State Integration**: Updates are merged into the local state store (NgRx or BehaviorSubject)

### Implementation Pattern

```typescript
// Service example with socket-based state updates
@Injectable({ providedIn: 'root' })
export class DashboardMetricsService {
  private metricsSubject = new BehaviorSubject<DashboardMetrics>(initialMetrics);
  readonly metrics$ = this.metricsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private socketClient: SocketClientService,
    private logger: LoggerService
  ) {
    // Initialize with REST data first
    this.loadInitialData();
    
    // Then subscribe to socket updates
    this.socketClient.on<Partial<DashboardMetrics>>('dashboard-metrics-update')
      .pipe(takeUntil(this.destroyed$))
      .subscribe(update => {
        const currentMetrics = this.metricsSubject.value;
        const updatedMetrics = { ...currentMetrics, ...update };
        this.metricsSubject.next(updatedMetrics);
        this.logger.debug('Metrics updated via socket', update);
      });
  }
  
  private loadInitialData() {
    this.apiService.get<DashboardMetrics>('metrics/dashboard')
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (metrics) => this.metricsSubject.next(metrics),
        error: (err) => this.logger.error('Failed to load initial metrics', err)
      });
  }
}
```

### Socket-Enabled Services

The following services use socket-based state updates:

* **User Activity Dashboard**: Live user activity metrics
* **Financial Data Stream**: Real-time financial data
* **Notification Service**: Push notifications
* **Logging Console**: Live application logs

See [SOCKET-SERVICES.md](./SOCKET-SERVICES.md) for detailed implementation.

### Candidates for Socket Implementation

These services could benefit from socket-based updates:

| Service | Current Implementation | Socket Benefit |
| ------- | ---------------------- | ------------- |
| Table Component | Toggle between client/server rendering | Real-time updates, progressive loading |
| Record Updates | Polling API for changes | Immediate push when records change |
| Data Visualizations | Manual refresh or polling | Live-updating charts and maps |
| Search Results | Traditional query-response | Streaming results as they're found |
