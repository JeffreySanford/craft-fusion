"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSkyModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const opensky_controller_1 = require("./opensky.controller");
const opensky_service_1 = require("./opensky.service");
let OpenSkyModule = class OpenSkyModule {
};
exports.OpenSkyModule = OpenSkyModule;
exports.OpenSkyModule = OpenSkyModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        controllers: [opensky_controller_1.OpenSkyController],
        providers: [opensky_service_1.OpenSkyService],
    })
], OpenSkyModule);
//# sourceMappingURL=opensky.module.js.map