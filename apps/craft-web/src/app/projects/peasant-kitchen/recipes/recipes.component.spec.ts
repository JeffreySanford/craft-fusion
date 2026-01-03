import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of } from 'rxjs';
import { RecipesComponent } from './recipes.component';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../services/recipe.interface';

describe('RecipesComponent', () => {
  let component: RecipesComponent;
  let fixture: ComponentFixture<RecipesComponent>;
  const mockRecipes: Recipe[] = [
    {
      id: 1,
      name: 'Test Recipe',
      description: 'A recipe for testing',
      countryCode: 'US',
      countryName: 'United States',
      servingSize: '2 servings',
      url: 'test-recipe',
      ingredients: ['1 cup flour'],
      directions: ['Mix', 'Bake'],
    },
  ];
  const mockCurrentRecipe = mockRecipes[0];

  const recipeServiceStub = {
    getRecipes: () => of(mockRecipes),
    getRecipe: () => of(mockCurrentRecipe),
    setRecipe: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecipesComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
      ],
      providers: [{ provide: RecipeService, useValue: recipeServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
