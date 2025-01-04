"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const recipes_service_1 = require("./recipes.service");
/**
 * Controller responsible for handling recipe-related HTTP requests.
 * Provides endpoints for retrieving recipe information.
 *
 * @route /recipes
 */
let RecipesController = class RecipesController {
    /**
     * Creates an instance of RecipesController.
     * @param recipesService - Service handling recipe business logic
     */
    constructor(recipesService) {
        this.recipesService = recipesService;
    }
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
    getAllRecipes() {
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
    getRecipeByUrl(url) {
        return this.recipesService.getRecipeByUrl(url);
    }
};
exports.RecipesController = RecipesController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Array)
], RecipesController.prototype, "getAllRecipes", null);
tslib_1.__decorate([
    (0, common_1.Get)(':url'),
    tslib_1.__param(0, (0, common_1.Param)('url')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Object)
], RecipesController.prototype, "getRecipeByUrl", null);
exports.RecipesController = RecipesController = tslib_1.__decorate([
    (0, common_1.Controller)('recipes'),
    tslib_1.__metadata("design:paramtypes", [recipes_service_1.RecipesService])
], RecipesController);
//# sourceMappingURL=recipes.controller.js.map