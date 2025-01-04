"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const recipes_service_1 = require("./recipes.service");
describe('RecipesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [recipes_service_1.RecipesService],
        }).compile();
        service = module.get(recipes_service_1.RecipesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=recipes.service.spec.js.map