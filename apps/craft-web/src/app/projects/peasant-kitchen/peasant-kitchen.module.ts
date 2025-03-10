import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeasantKitchenComponent } from './peasant-kitchen.component';
import { RecipeComponent } from './recipe/recipe.component';
import { RecipesComponent } from './recipes/recipes.component';
import { MaterialModule } from '../../material.module';
import { AnimatedDirectivesModule } from '../../animated-directives.module';

import { PeasantKitchenService } from './peasant-kitchen.service';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    PeasantKitchenComponent,
    RecipeComponent,
    RecipesComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    AnimatedDirectivesModule,
    RouterModule
  ],
  providers: [PeasantKitchenService],
  exports: [
    PeasantKitchenComponent
  ]
})
export class PeasantKitchenModule {}
