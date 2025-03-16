import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PeasantKitchenService } from '../peasant-kitchen.service';
import { Recipe } from '../recipe.class';

@Component({
  selector: 'app-recipes',
  standalone: false,
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.scss']
})
export class RecipesComponent implements OnInit, OnDestroy {
  recipes: Recipe[] = [];
  loaded = false;
  recipeSubscription!: Subscription;
  recipe!: Recipe;
  allRecipes = true;
  currentPage = 1; // Start with page 1
  pageSize = 4;
  paginatedRecipes: Recipe[] = []; // Array to hold the recipes for the current page
  totalPages: number = 0; // Total number of pages based on the recipes array length

  constructor(private peasantKitchenService: PeasantKitchenService, private router: Router) {}

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedRecipes();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedRecipes();
    }
  }

  updatePaginatedRecipes(): void {
    this.paginatedRecipes = this.recipes.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  ngOnDestroy() {
    if (this.recipeSubscription) {
      this.recipeSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    console.log('Recipes component initialized');
    
    // Add some dummy recipes if service doesn't return any (for testing)
    setTimeout(() => {
      if (!this.loaded || this.recipes.length === 0) {
        console.log('Adding fallback recipes for testing');
        this.recipes = [
          { id: 1, name: 'Classic Beef Stew', description: 'A hearty beef stew with root vegetables', countryOfOrigin: 'France', servingSize: '6 servings', url: 'classic-beef-stew', ingredients: ['2 lbs beef chuck', '4 carrots', '2 onions', '3 potatoes'], directions: ['Brown the beef', 'Add vegetables and broth', 'Simmer for 2 hours'] },
          { id: 2, name: 'Simple Pasta Carbonara', description: 'Traditional Roman pasta dish', countryOfOrigin: 'Italy', servingSize: '4 servings', url: 'pasta-carbonara', ingredients: ['1 lb spaghetti', '8 oz pancetta', '4 egg yolks', '1 cup Pecorino Romano'], directions: ['Cook pasta', 'Fry pancetta', 'Mix eggs and cheese', 'Toss all together while hot'] }
        ];
        this.loaded = true;
        this.updatePaginatedRecipes();
      }
    }, 2000);
    
    this.recipeSubscription = this.peasantKitchenService.getRecipes().subscribe({
      next: (recipes: Recipe[]) => {
        console.log('Recipes received:', recipes);
        this.recipes = recipes;

        this.updatePaginatedRecipes();
        this.totalPages = Math.ceil(this.recipes.length / this.pageSize);
        console.log('Paginated recipes:', this.paginatedRecipes);
        
        if (this.recipes.length === 0) {
          console.warn('No recipes found in the service');
        }
        console.log('Setting current recipe:', this.recipe);
        if (this.recipes.length > 0) {
          this.recipe = this.peasantKitchenService.getRecipe();
        } else {
          console.warn('No recipes available to set as current');
        }
        
        this.loaded = true;
      },
      error: (err) => {
        console.error('Error fetching recipes:', err);
        this.loaded = false;
      },
      complete: () => {
        console.log('Recipe fetch complete');
      }
    });
  }

  navigateToRecipe(recipe: Recipe): void {
    console.log('Navigating to recipe:', recipe);
    this.peasantKitchenService.setRecipe(recipe);
    this.router.navigate([`/peasant-kitchen/recipe/:${recipe.url}`]);
  }
}
