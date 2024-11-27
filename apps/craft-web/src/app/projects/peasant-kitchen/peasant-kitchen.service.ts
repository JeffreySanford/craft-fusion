import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe } from './recipe.class';

@Injectable()
export class PeasantKitchenService {
  @Inject('apiUrl') private apiUrl!: string;

   recipe!: Recipe;

  constructor(private http: HttpClient) {}

  getRecipes(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.apiUrl + '/recipes');
  }

  setRecipe(recipe: Recipe): void {
    this.recipe = recipe;
  }

  getRecipe(): Recipe {
    return this.recipe;
  }
}