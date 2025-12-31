import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../services/recipe.interface';
import { RecipeService } from '../services/recipe.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-recipe',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
  standalone: false, // CRITICAL: Must always be explicitly set to false for all components
})
export class RecipeComponent implements OnInit {
  recipe!: Recipe;
  error: string = '';
  loading: boolean = true;

  constructor(
    @Inject(RecipeService) private recipeService: RecipeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.recipeService
      .getRecipe()
      .pipe(
        catchError(err => {
          console.error('Error loading recipe:', err);
          this.error = 'Recipe not found. Please select a recipe from the list.';
          this.loading = false;
          // Create a placeholder recipe after a short delay, then redirect
          setTimeout(() => {
            this.router.navigate(['/peasant-kitchen']);
          }, 3000);
          return of(null);
        }),
      )
      .subscribe({
        next: (recipe: Recipe | null) => {
          if (recipe) {
            this.recipe = recipe;
            this.loading = false;
            console.log('Recipe in RecipeComponent:', this.recipe);
          }
        },
        error: (err: unknown) => {
          console.error('Error in subscription:', err);
        },
        complete: () => {
          console.log('Recipe loading complete');
        },
      });
  }

  /**
   * Public getter for the recipe service
   */
  public get service(): RecipeService {
    return this.recipeService;
  }
}
