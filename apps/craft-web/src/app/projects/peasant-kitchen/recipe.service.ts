import { Injectable } from '@angular/core';
import { Observable, catchError, tap, of } from 'rxjs';
import { Recipe } from './recipe.class';
import { ApiService } from '../../common/services/api.service';

@Injectable()
export class RecipeService {
  private recipe!: Recipe;
  private readonly endpoint = 'recipes';
  private readonly defaultRecipe: Recipe = {
    id: 0,
    name: 'Sample Recipe',
    description: 'This is a sample recipe to show when none is selected.',
    countryCode: 'US',
    countryName: 'United States of America',
    servingSize: '4 servings',
    ingredients: ['1 cup of flour', '2 eggs', '1/2 cup milk', '1 tsp salt'],
    directions: ['Mix all ingredients together', 'Cook until done', 'Enjoy!'],
    url: 'sample-recipe'
  };

  constructor(private apiService: ApiService) {}

  /**
   * Retrieves all recipes from the system
   * @returns Observable<Recipe[]> - Array of all recipes
   */
  getRecipes(): Observable<Recipe[]> {
    console.log('Fetching all recipes');
    return this.apiService.get<Recipe[]>(this.endpoint).pipe(
      tap(recipes => console.log(`Retrieved ${recipes.length} recipes`)),
      catchError((error: any) => {
        console.error('Error fetching recipes:', error);
        return of([]);
      })
    );
  }

  /**
   * Sets the currently selected recipe
   * @param recipe - Recipe to be set as current
   */
  setRecipe(recipe: Recipe): void {
    console.log('Setting current recipe:', recipe.id);
    this.recipe = recipe;
  }

  /**
   * Gets the currently selected recipe
   * @returns Recipe - Currently selected recipe
   * @throws Error if no recipe is selected
   */
  getRecipe(): Recipe {
    if (!this.recipe) {
      console.warn('No recipe currently selected - returning default recipe');
      console.log('Returning default recipe:', this.defaultRecipe);
      return this.defaultRecipe;
    }
    if (!this.recipe.countryCode) {
      this.recipe.countryCode = 'Unknown';
    }
    console.log('Getting current recipe:', this.recipe.id);
    return this.recipe;
  }

  /**
   * Gets the full country name based on the two-letter code
   * @param countryCode - Two-letter country code
   * @returns string - Full country name
   */
  getCountryName(countryCode: string | undefined): string {
    switch (countryCode) {
      case 'US':
        return 'United States of America';
      case 'ZA':
        return 'South Africa';
      default:
        return 'Unknown';
    }
  }

  /**
   * Checks if a recipe is currently selected
   * @returns boolean
   */
  hasRecipe(): boolean {
    return !!this.recipe;
  }

  /**
   * Creates a new recipe
   * @param recipe - Recipe data to create
   * @returns Observable<Recipe>
   */
  addRecipe(recipe: Recipe): Observable<Recipe> {
    console.log('Adding new recipe:', recipe);
    return this.apiService.post<Recipe, Recipe>(this.endpoint, recipe).pipe(
      tap(newRecipe => console.log('Created recipe:', newRecipe.id)),
      catchError((error: any) => {
        console.error('Error creating recipe:', error);
        throw error;
      })
    );
  }

  /**
   * Updates an existing recipe
   * @param recipe - Recipe data to update
   * @returns Observable<Recipe>
   */
  updateRecipe(recipe: Recipe): Observable<Recipe> {
    console.log('Updating recipe:', recipe.id);
    return this.apiService.put<Recipe>(`${this.endpoint}/${recipe.id}`, recipe).pipe(
      tap(updatedRecipe => console.log('Updated recipe:', updatedRecipe.id)),
      catchError((error: any) => {
        console.error('Error updating recipe:', error);
        throw error;
      })
    );
  }

  /**
   * Deletes a recipe
   * @param id - Recipe ID to delete
   * @returns Observable<void>
   */
  deleteRecipe(id: string): Observable<void> {
    console.log('Deleting recipe:', id);
    return this.apiService.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => console.log('Deleted recipe:', id)),
      catchError((error: any) => {
        console.error('Error deleting recipe:', error);
        throw error;
      })
    );
  }
}