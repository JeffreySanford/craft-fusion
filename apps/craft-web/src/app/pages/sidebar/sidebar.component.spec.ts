import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AdminStateService } from '../../common/services/admin-state.service';
import { AuthenticationService } from '../../common/services/authentication.service';
import { SidebarStateService } from '../../common/services/sidebar-state.service';
import { Directive, Input } from '@angular/core';
import { of } from 'rxjs';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[routerLink]' })
class RouterLinkStubDirective {
  @Input('routerLink') link?: any;
}

class RouterStub {
  events = of(new NavigationEnd(1, '/home', '/home'));
  url = '/home';
}

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  const breakpointObserverMock = {
    observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
    isMatched: jest.fn().mockReturnValue(false),
  } as unknown as BreakpointObserver;
  const sidebarStateServiceMock = {
    toggleSidebar: jest.fn(),
  };
  const adminStateServiceMock = {
    isAdmin$: of(false),
  };
  const authenticationServiceMock = {
    isAdmin$: of(false),
  } as unknown as AuthenticationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [MatIconModule, MatListModule, MatButtonModule, RouterLinkStubDirective],
      providers: [
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
        { provide: SidebarStateService, useValue: sidebarStateServiceMock },
        { provide: AdminStateService, useValue: adminStateServiceMock },
        { provide: AuthenticationService, useValue: authenticationServiceMock },
        { provide: Router, useClass: RouterStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
