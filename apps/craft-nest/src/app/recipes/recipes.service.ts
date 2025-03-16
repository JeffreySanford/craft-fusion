import { Injectable } from '@nestjs/common';
import recipes from './recipes.json';

export interface Recipe {
  name: string;
  countryOfOrigin: string;
  description: string;
  ingredients: string[];
  directions: string[];
  servingSize?: string;
  url: string;
  history?: string[];
}

@Injectable()
export class RecipesService {
  recipes: Recipe[] = [];
 
  constructor() {
    console.log('RecipesService initialized with recipes:', recipes);
    this.recipes = recipes.recipes;
    if (!this.recipes || this.recipes.length === 0) {
      console.warn('No recipes found in the service. Please check the recipes.json file.');
    }
  }
  getAllRecipes() {
    return this.recipes;
  }

  getRecipeByUrl(url: string): Recipe {
    const recipe = this.recipes.find(recipe => recipe.url === url);
    if (!recipe) {
      throw new Error(`Recipe with url ${url} not found`);
    }
    return recipe;
  }
}