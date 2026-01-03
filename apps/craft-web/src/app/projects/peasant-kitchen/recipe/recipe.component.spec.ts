import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RecipeComponent } from './recipe.component';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../services/recipe.interface';
import { of, throwError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const baseRecipe: Recipe = {
  id: 1,
  name: 'Test Recipe',
  description: 'A recipe for testing',
  countryCode: 'US',
  countryName: 'United States',
  servingSize: '2 servings',
  ingredients: [],
  directions: [''],
  url: 'test-recipe',
};

describe('RecipeComponent', () => {
  let component: RecipeComponent;
  let fixture: ComponentFixture<RecipeComponent>;
  let mockRecipeService: jest.Mocked<RecipeService>;
  let mockRouter: jest.Mocked<Router>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRecipeService = {
      getRecipe: jest.fn(),
      getCountryName: jest.fn(),
    } as unknown as jest.Mocked<RecipeService>;

    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      declarations: [RecipeComponent],
      imports: [RouterTestingModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeComponent);
    component = fixture.componentInstance;
    mockRecipeService.getRecipe.mockReturnValue(of(baseRecipe));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize recipe on ngOnInit', () => {
    const baseRecipe: Recipe = {
      id: 1,
      name: 'Test Recipe',
      description: 'A recipe for testing',
      countryCode: 'US',
      countryName: 'United States',
      servingSize: '2 servings',
      ingredients: [],
      directions: [''],
      url: 'test-recipe',
    };
    const mockRecipe: Recipe = { ...baseRecipe };
    mockRecipeService.getRecipe.mockReturnValue(of(mockRecipe));

    component.ngOnInit();

    expect(component.recipe).toEqual(mockRecipe);
  });

  it('should navigate to /peasant-kitchen if recipe is not found', fakeAsync(() => {
    mockRecipeService.getRecipe.mockReturnValue(throwError('not found'));

    component.ngOnInit();
    flush();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/peasant-kitchen']);
  }));
});
