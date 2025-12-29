import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PeasantKitchenComponent } from './peasant-kitchen.component';
import { RecipesComponent } from './recipes/recipes.component';
import { RecipeComponent } from './recipe/recipe.component';
import { MaterialModule } from '../../material.module';
import { RecipeService } from './services/recipe.service';

@NgModule({
  declarations: [
    PeasantKitchenComponent,
    RecipesComponent,
    RecipeComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule.forChild([
      {
        path: '',
        component: PeasantKitchenComponent,
        children: [
          { path: '', component: RecipesComponent },
          { path: 'recipe/:id', component: RecipeComponent }
        ]
      }
    ])
  ],
  providers: [RecipeService],
})
export class PeasantKitchenModule { }
