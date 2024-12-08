import { Controller, Get, Param } from '@nestjs/common';
import { Recipe } from './recipes.service';
import { RecipesService } from './recipes.service';

/**
 * Controller responsible for handling recipe-related HTTP requests.
 * Provides endpoints for retrieving recipe information.
 * 
 * @route /recipes
 */
@Controller('recipes')
export class RecipesController {
  /**
   * Creates an instance of RecipesController.
   * @param recipesService - Service handling recipe business logic
   */
  constructor(private readonly recipesService: RecipesService) {}

  /**
   * Retrieves all recipes from the system
   * @returns Recipe[] Array of all available recipes
   * 
   * @example
   * GET /recipes
   * Response: [
   *   {
   *     "name": "Pasta Carbonara",
   *     "countryOfOrigin": "Italy",
   *     "ingredients": ["pasta", "eggs", "cheese"]
   *   }
   * ]
   */
  @Get()
  getAllRecipes(): Recipe[] {
    return this.recipesService.getAllRecipes();
  }

  /**
   * Retrieves a specific recipe by its URL
   * @param url - URL-friendly identifier for the recipe
   * @returns Recipe Matching recipe object
   * 
   * @example
   * GET /recipes/pasta-carbonara
   * Response: {
   *   "name": "Pasta Carbonara",
   *   "countryOfOrigin": "Italy",
   *   "ingredients": ["pasta", "eggs", "cheese"]
   * }
   */
  @Get(':url')
  getRecipeByUrl(@Param('url') url: string): Recipe {
    return this.recipesService.getRecipeByUrl(url);
  }
}