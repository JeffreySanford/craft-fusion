import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeasantKitchenComponent } from './peasant-kitchen.component';
import { RecipeComponent } from './recipe/recipe.component';
import { RecipesComponent } from './recipes/recipes.component';
import { MaterialModule } from '../../material.module';
import { AnimatedDirectivesModule } from '../../animated-directives.module';

import { RecipeService } from './recipe.service';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    PeasantKitchenComponent,
    RecipesComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    AnimatedDirectivesModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  providers: [RecipeService],
  exports: [
    PeasantKitchenComponent
  ]
})
export class PeasantKitchenModule {}
