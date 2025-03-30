// DTOs for creating and updating recipes
export class CreateRecipeDto {
  name!: string; // Non-null assertion operator
  ingredients!: string[]; // Non-null assertion operator
  instructions!: string; // Non-null assertion operator
}

export class UpdateRecipeDto {
  name?: string; // Optional property
  ingredients?: string[]; // Optional property
  instructions?: string; // Optional property
}
