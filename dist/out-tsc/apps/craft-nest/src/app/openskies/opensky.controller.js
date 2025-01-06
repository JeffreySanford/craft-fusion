"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSkyController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const opensky_service_1 = require("./opensky.service");
const rxjs_1 = require("rxjs");
let OpenSkyController = class OpenSkyController {
    constructor(openSkyService) {
        this.openSkyService = openSkyService;
    }
    getFlightData() {
        return this.openSkyService.fetchFlightData();
    }
};
exports.OpenSkyController = OpenSkyController;
tslib_1.__decorate([
    (0, common_1.Get)('flightParams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], OpenSkyController.prototype, "getFlightData", null);
exports.OpenSkyController = OpenSkyController = tslib_1.__decorate([
    (0, common_1.Controller)('opensky'),
    tslib_1.__metadata("design:paramtypes", [opensky_service_1.OpenSkyService])
], OpenSkyController);
//# sourceMappingURL=opensky.controller.js.map