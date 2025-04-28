```markdown
# Craft Fusion Coding Standards

## Angular Guidelines

- **NEVER use standalone components** - They introduce many errors and compatibility issues
- Always use NgModule-based architecture for all components
- Always maintain `standalone: false` for all components
- Components must always be declared in their respective modules
- Leverage Angular dependency injection for services
- Implement lazy loading for all feature modules
- Use resolvers for preloading necessary data
- Follow reactive forms approach instead of template-driven forms

### Component Configuration

```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  standalone: false  // CRITICAL: Must always be false for all components
})
export class ExampleComponent implements OnInit {
  // Component implementation
}
```

### Module Configuration

```typescript
@NgModule({
  declarations: [
    ExampleComponent,  // Always declare components here, never use imports for components
    OtherComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    // Only import modules, never components
  ],
  exports: [
    ExampleComponent  // Export components that need to be used outside this module
  ]
})
export class FeatureModule { }
```

## Real-Time Communication Standards

### Socket.IO Implementation

When implementing Socket.IO functionality, follow these standards:

```typescript
// Backend Socket Emission (NestJS)
@Injectable()
export class DataService {
  constructor(private socketService: SocketService) {}
  
  updateData(data: any): void {
    // Process data
    // ...
    
    // Emit to clients - use specific, namespaced event names
    this.socketService.emitToAll('data:update', data);
  }
}

// Frontend Socket Reception (Angular)
@Injectable({
  providedIn: 'root'
})
export class DataFacade {
  private dataSubject = new BehaviorSubject<DataType[]>([]);
  readonly data$ = this.dataSubject.asObservable();
  
  constructor(private socketClient: SocketClientService) {
    // Subscribe to socket events
    this.socketClient.on<DataType[]>('data:update')
      .pipe(
        takeUntil(this.destroyed$),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(data => {
        this.dataSubject.next(data);
      });
  }
}
```

### When to Use Sockets vs. HTTP

| Data Characteristic | Recommended Approach |
|---------------------|---------------------|
| High frequency updates | Socket.IO |
| Large initial dataset | HTTP + Socket for updates |
| User-specific updates | Socket.IO with rooms |
| Infrequent updates | Traditional HTTP |
| Critical transactions | HTTP with confirmation |
| Collaborative features | Socket.IO |

### Socket Event Naming Conventions

Socket events should use a namespaced approach with colon separators:

- `entity:action` - e.g., `user:login`, `record:update`
- `domain:entity:action` - e.g., `finance:stock:update`, `admin:logs:new`

See [SOCKET-SERVICES.md](./SOCKET-SERVICES.md) for more detailed implementation guidelines.
```