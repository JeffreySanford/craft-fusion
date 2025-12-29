export class Recipe {
  id: number;
  name: string;
  description?: string;
  countryCode?: string;
  countryName?: string;
  servingSize?: string;
  ingredients: string[];
  directions: string[];
  url: string;

  constructor(id: number, name: string, ingredients: string[], directions: string[], url: string) {
    this.id = id;
    this.name = name;
    this.ingredients = ingredients;
    this.directions = directions;
    this.url = url;
  }
}
