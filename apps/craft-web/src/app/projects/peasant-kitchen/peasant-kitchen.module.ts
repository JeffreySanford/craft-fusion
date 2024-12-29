import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeasantKitchenComponent } from './peasant-kitchen.component';
import { RecipeComponent } from './recipe/recipe.component';
import { PeasantKitchenService } from './peasant-kitchen.service';
import { RouterModule } from '@angular/router';
import { RecipesComponent } from './recipes/recipes.component';

@NgModule({
  declarations: [RecipeComponent, PeasantKitchenComponent, RecipesComponent],
  imports: [CommonModule],
  providers: [PeasantKitchenService],
})
export class PeasantKitchenModule {}
