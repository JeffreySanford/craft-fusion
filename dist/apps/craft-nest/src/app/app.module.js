"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const records_module_1 = require("./records/records.module");
const recipes_module_1 = require("./recipes/recipes.module");
const opensky_module_1 = require("./openskies/opensky.module");
const alpha_vantage_module_1 = require("./financial/alpha-vantage/alpha-vantage.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            users_module_1.UsersModule,
            records_module_1.RecordsModule,
            recipes_module_1.RecipesModule,
            opensky_module_1.OpenSkyModule,
            alpha_vantage_module_1.AlphaVantageModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map