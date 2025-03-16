import { Component, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../recipe.class';
import { RecipeService } from '../recipe.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LowerCasePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipe',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LowerCasePipe,
    CommonModule
  ],
  standalone: true,
})
export class RecipeComponent implements OnInit {
  recipe!: Recipe;
  error: string = '';
  loading: boolean = true;

  constructor(@Inject(RecipeService) private recipeService: RecipeService, private router: Router) { }

  ngOnInit(): void {
    try {
      this.recipe = this.recipeService.getRecipe();
      this.loading = false;
      debugger
      console.log(this.recipe.countryCode);
      console.log('Country Code:', this.recipe.countryCode);
      console.log('Recipe in RecipeComponent:', this.recipe);
    } catch (err) {
      console.error('Error loading recipe:', err);
      this.error = 'Recipe not found. Please select a recipe from the list.';
      this.loading = false;
      
      // Create a placeholder recipe after a short delay, then redirect
      setTimeout(() => {
        this.router.navigate(['/peasant-kitchen']);
      }, 3000);
    }
  }

  /**
   * Public getter for the recipe service
   */
  public get service(): RecipeService {
    return this.recipeService;
  }
}