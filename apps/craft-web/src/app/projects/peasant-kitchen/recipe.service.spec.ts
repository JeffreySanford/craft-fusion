import { TestBed } from '@angular/core/testing';

import { RecipeService } from './recipe.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecipeService],
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(RecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
