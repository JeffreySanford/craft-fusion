import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../recipe.class';
import { PeasantKitchenService } from '../peasant-kitchen.service';

@Component({
  selector: 'app-recipe',
  standalone: false,
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss'],
})
export class RecipeComponent implements OnInit {
  recipe!: Recipe;
  error: string = '';
  loading: boolean = true;

  constructor(private recipeService: PeasantKitchenService, private router: Router) { }

  ngOnInit(): void {
    try {
      this.recipe = this.recipeService.getRecipe();
      this.loading = false;
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
   * Navigate back to the recipes list
   */
  goBackToRecipes(): void {
    console.log('Back button pressed, returning to parent container.');
    this.router.navigate(['peasant-kitchen']);
  }
}