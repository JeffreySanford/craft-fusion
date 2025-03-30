import { Controller, Get, Post, Body, Param, Put, Delete, Logger } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { Recipe } from './interfaces/recipe.interface';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('recipes')
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly recipesService: RecipesService) {
    this.logger.log('RecipesController initialized');
  }

  @Get()
  findAll(): Observable<Recipe[]> {
    return this.recipesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<Recipe> {
    return this.recipesService.findOne(id).pipe(
      map(recipe => {
        if (!recipe) {
          throw new Error(`Recipe with ID ${id} not found`);
        }
        return recipe;
      })
    );
  }

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto): Observable<Recipe> {
    const recipe: Recipe = {
      id: Date.now().toString(),
      ...createRecipeDto
    };
    return this.recipesService.create(recipe);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto): Observable<Recipe> {
    return this.recipesService.update(id, updateRecipeDto as Recipe).pipe(
      map(recipe => {
        if (!recipe) {
          throw new Error(`Recipe with ID ${id} not found`);
        }
        return recipe;
      })
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<{ success: boolean }> {
    return this.recipesService.remove(id).pipe(
      map(success => ({ success }))
    );
  }
}