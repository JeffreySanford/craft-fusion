import { OperatorFunction } from "rxjs";

export interface Recipe {
  id: number;
  name: string;
  description: string;
  countryCode: string;
  countryName: string;
  servingSize: string;
  ingredients: string[];
  directions: string[];
  url: string;
}
