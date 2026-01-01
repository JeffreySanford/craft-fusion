import { Injectable } from '@angular/core';
import { Observable, catchError, tap, of, throwError, timer } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { Recipe } from './recipe.interface';
import { ApiService } from '../../../common/services/api.service';

@Injectable()
export class RecipeService {
  private recipe!: Recipe;
  private readonly endpoint = 'recipes';
  private isOfflineMode = false;
  private readonly REQUEST_TIMEOUT = 5000;                     
  private readonly defaultRecipe: Recipe = {
    id: 0,
    name: 'Sample Recipe',
    description: 'This is a sample recipe to show when none is selected.',
    countryCode: 'US',
    countryName: 'United States of America',
    servingSize: '4 servings',
    ingredients: [
      '1 cup of flour',
      '2 eggs',
      '1/2 cup milk',
      '1 tsp salt',
      '1 tbsp sugar',
      '1/2 cup butter',
      '1 tsp vanilla extract',
      '1/2 cup chocolate chips',
      '1/4 cup cocoa powder',
      '1/2 tsp baking powder',
    ],
    directions: ['Mix all ingredients together', 'Cook until done', 'Enjoy!'],
    url: 'sample-recipe',
  };

  private readonly fallbackRecipes: Recipe[] = [
    {
      id: 1,
      name: 'Classic Beef Stew',
      description: 'A hearty beef stew with root vegetables',
      countryCode: 'FR',
      countryName: 'France',
      servingSize: '6 servings',
      url: 'classic-beef-stew',
      ingredients: ['2 lbs beef chuck', '4 carrots', '2 onions', '3 potatoes'],
      directions: ['Brown the beef', 'Add vegetables and broth', 'Simmer for 2 hours'],
    },
    {
      id: 2,
      name: 'Simple Pasta Carbonara',
      description: 'Traditional Roman pasta dish',
      countryCode: 'IT',
      countryName: 'Italy',
      servingSize: '4 servings',
      url: 'pasta-carbonara',
      ingredients: ['1 lb spaghetti', '8 oz pancetta', '4 egg yolks', '1 cup Pecorino Romano'],
      directions: ['Cook pasta', 'Fry pancetta', 'Mix eggs and cheese', 'Toss all together while hot'],
    },
  ];

  constructor(private apiService: ApiService) {}

  getRecipes(): Observable<Recipe[]> {
    if (this.isOfflineMode) {
      console.log('In offline mode - returning fallback recipes');
      return of(this.fallbackRecipes);
    }

    console.log('Fetching all recipes');
    return this.apiService.get<Recipe[]>(this.endpoint).pipe(
      timeout(this.REQUEST_TIMEOUT),
      retry({ count: 2, delay: (_, retryCount) => timer(retryCount * 1000) }),
      tap(recipes => console.log(`Retrieved ${recipes.length} recipes`)),
      catchError((error: unknown) => {
        console.error('Error fetching recipes:', error);
        this.isOfflineMode = true;
        console.warn('Switching to offline mode with fallback recipes');
        return of(this.fallbackRecipes);
      }),
    );
  }

  setRecipe(recipe: Recipe): void {
    console.log('Setting current recipe:', recipe.id);
    this.recipe = recipe;
  }

  getRecipe(): Observable<Recipe> {
    if (!this.recipe) {
      console.warn('No recipe currently selected - returning default recipe');
      console.log('Returning default recipe:', this.defaultRecipe);
      return of(this.defaultRecipe);
    }
    if (!this.recipe.countryCode) {
      this.recipe.countryCode = 'Unknown';
    }
    console.log('Getting current recipe:', this.recipe.id);
    return of(this.recipe);
  }

  getCountryName(countryCode: string | undefined): string {
    switch (countryCode) {
      case 'US':
        return 'United States of America';
      case 'IT':
        return 'Italy';
      case 'FR':
        return 'France';
      case 'ZA':
        return 'South Africa';
      default:
        return 'Unknown';
    }
  }

  hasRecipe(): boolean {
    return !!this.recipe;
  }

  addRecipe(recipe: Recipe): Observable<Recipe> {
    if (this.isOfflineMode) {
      console.warn('Cannot add recipe in offline mode');
      return throwError(() => new Error('Cannot add recipe in offline mode'));
    }

    console.log('Adding new recipe:', recipe);
    return this.apiService.post<Recipe, Recipe>(this.endpoint, recipe).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(newRecipe => console.log('Created recipe:', newRecipe.id)),
      catchError((error: unknown) => {
        console.error('Error creating recipe:', error);
        this.isOfflineMode = true;
        throw error;
      }),
    );
  }

  updateRecipe(recipe: Recipe): Observable<Recipe> {
    if (this.isOfflineMode) {
      console.warn('Cannot update recipe in offline mode');
      return throwError(() => new Error('Cannot update recipe in offline mode'));
    }

    console.log('Updating recipe:', recipe.id);
    return this.apiService.put<Recipe>(`${this.endpoint}/${recipe.id}`, recipe).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(updatedRecipe => console.log('Updated recipe:', updatedRecipe.id)),
      catchError((error: unknown) => {
        console.error('Error updating recipe:', error);
        this.isOfflineMode = true;
        throw error;
      }),
    );
  }

  deleteRecipe(id: string): Observable<void> {
    if (this.isOfflineMode) {
      console.warn('Cannot delete recipe in offline mode');
      return throwError(() => new Error('Cannot delete recipe in offline mode'));
    }

    console.log('Deleting recipe:', id);
    return this.apiService.delete<void>(`${this.endpoint}/${id}`).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(() => console.log('Deleted recipe:', id)),
      catchError((error: unknown) => {
        console.error('Error deleting recipe:', error);
        this.isOfflineMode = true;
        throw error;
      }),
    );
  }
}
