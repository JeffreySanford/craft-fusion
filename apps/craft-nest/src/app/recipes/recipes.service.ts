import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';
import recipes from './recipes.json';

export interface Recipe {
  name: string;
  countryCode: string;
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
 
  constructor(private readonly loggingService: LoggingService) {
    this.loggingService.info('RecipesService initialized with recipes', { count: recipes.recipes.length });
    this.recipes = recipes.recipes;
    if (!this.recipes || this.recipes.length === 0) {
      this.loggingService.warn('No recipes found in the service. Please check the recipes.json file.');
    }
  }
  
  getAllRecipes() {
    this.loggingService.info('Retrieving all recipes');
    return this.recipes;
  }

  getRecipeByUrl(url: string): Recipe {
    this.loggingService.info(`Looking for recipe with URL: ${url}`);
    const recipe = this.recipes.find(recipe => recipe.url === url);
    if (!recipe) {
      this.loggingService.error(`Recipe with URL ${url} not found`);
      throw new Error(`Recipe with url ${url} not found`);
    }
    return recipe;
  }
}