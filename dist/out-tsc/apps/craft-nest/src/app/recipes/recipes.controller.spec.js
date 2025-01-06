"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const recipes_controller_1 = require("./recipes.controller");
const recipes_service_1 = require("./recipes.service");
describe('RecipesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [recipes_controller_1.RecipesController],
            providers: [
                {
                    provide: recipes_service_1.RecipesService,
                    useValue: {
                    // mock implementation of RecipesService methods
                    },
                },
            ],
        }).compile();
        controller = module.get(recipes_controller_1.RecipesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=recipes.controller.spec.js.map