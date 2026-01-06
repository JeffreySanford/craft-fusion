import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Recipe } from '../services/recipe.interface';
import { RecipeService } from '../services/recipe.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-recipe',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
  standalone: false,                                                                       
})
export class RecipeComponent implements OnInit {
  recipe: Recipe | null = null;
  error = '';
  loading = true;

  constructor(
    @Inject(RecipeService) private recipeService: RecipeService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const navigationRecipe = history.state?.['recipe'] as Recipe | undefined;
    if (navigationRecipe) {
      this.recipe = navigationRecipe;
      this.loading = false;
      console.log('Using recipe from navigation state:', this.recipe);
      return;
    }

    const recipeUrl = this.route.snapshot.paramMap.get('id');
    const recipeLoader$ = recipeUrl ? this.recipeService.getRecipeByUrl(recipeUrl) : this.recipeService.getRecipe();

    recipeLoader$
      .pipe(
        catchError(err => {
          console.error('Error loading recipe:', err);
          this.error = 'Recipe not found. Please select a recipe from the list.';
          this.loading = false;

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

  public get service(): RecipeService {
    return this.recipeService;
  }

  goBack(): void {
    this.router.navigate(['/peasant-kitchen']);
  }
}
