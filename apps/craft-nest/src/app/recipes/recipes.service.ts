import { Injectable } from '@nestjs/common';
import { Recipe } from './interfaces/recipe.interface';
import { LoggingService } from '../logging/logging.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class RecipesService {
  private readonly recipes: Recipe[] = [];

  constructor(private readonly loggingService: LoggingService) {
    this.loggingService.info('RecipesService initialized');
    
    // Add some initial recipes
    this.recipes.push(
      { id: '1', name: 'Pasta Carbonara', ingredients: ['pasta', 'eggs', 'cheese', 'bacon'], instructions: 'Mix and cook' },
      { id: '2', name: 'Pizza Margherita', ingredients: ['dough', 'tomato sauce', 'mozzarella', 'basil'], instructions: 'Bake in hot oven' }
    );
    
    this.loggingService.info(`Initialized with ${this.recipes.length} recipes`);
  }

  findAll(): Observable<Recipe[]> {
    this.loggingService.info('Finding all recipes');
    return of([...this.recipes]);
  }

  findOne(id: string): Observable<Recipe | undefined> {
    this.loggingService.info(`Finding recipe with id: ${id}`);
    const recipe = this.recipes.find(recipe => recipe.id === id);
    return of(recipe);
  }

  create(recipe: Recipe): Observable<Recipe> {
    this.loggingService.info(`Creating new recipe: ${recipe.name}`);
    this.recipes.push(recipe);
    return of(recipe);
  }

  update(id: string, recipe: Recipe): Observable<Recipe | undefined> {
    this.loggingService.info(`Updating recipe with id: ${id}`);
    const index = this.recipes.findIndex(r => r.id === id);
    if (index === -1) {
      return of(undefined);
    }
    
    this.recipes[index] = { ...recipe, id };
    return of(this.recipes[index]);
  }

  remove(id: string): Observable<boolean> {
    this.loggingService.info(`Removing recipe with id: ${id}`);
    const index = this.recipes.findIndex(r => r.id === id);
    if (index === -1) {
      return of(false);
    }
    
    this.recipes.splice(index, 1);
    return of(true);
  }
}