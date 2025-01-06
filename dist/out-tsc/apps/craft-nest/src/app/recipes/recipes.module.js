"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const recipes_controller_1 = require("./recipes.controller");
const recipes_service_1 = require("./recipes.service");
let RecipesModule = class RecipesModule {
};
exports.RecipesModule = RecipesModule;
exports.RecipesModule = RecipesModule = tslib_1.__decorate([
    (0, common_1.Module)({
        controllers: [recipes_controller_1.RecipesController],
        providers: [recipes_service_1.RecipesService],
    })
], RecipesModule);
//# sourceMappingURL=recipes.module.js.map