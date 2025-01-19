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
    fetchFlightData() {
        return this.openSkyService.fetchFlightData();
    }
    getAirportData() {
        return this.openSkyService.fetchAirportData();
    }
    getFlightDataByAirline(airline) {
        return this.openSkyService.fetchFlightDataByAirline(airline);
    }
    getFlightDataByAircraft(aircraft) {
        return this.openSkyService.fetchFlightDataByAircraft(aircraft);
    }
};
exports.OpenSkyController = OpenSkyController;
tslib_1.__decorate([
    (0, common_1.Get)('flightParams'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], OpenSkyController.prototype, "getFlightData", null);
tslib_1.__decorate([
    (0, common_1.Get)('fetchflightdata'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], OpenSkyController.prototype, "fetchFlightData", null);
tslib_1.__decorate([
    (0, common_1.Get)('airports'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], OpenSkyController.prototype, "getAirportData", null);
tslib_1.__decorate([
    (0, common_1.Get)('flights/airline/:airline'),
    tslib_1.__param(0, (0, common_1.Param)('airline')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], OpenSkyController.prototype, "getFlightDataByAirline", null);
tslib_1.__decorate([
    (0, common_1.Get)('flights/aircraft/:aircraft'),
    tslib_1.__param(0, (0, common_1.Param)('aircraft')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", rxjs_1.Observable)
], OpenSkyController.prototype, "getFlightDataByAircraft", null);
exports.OpenSkyController = OpenSkyController = tslib_1.__decorate([
    (0, common_1.Controller)('opensky'),
    tslib_1.__metadata("design:paramtypes", [opensky_service_1.OpenSkyService])
], OpenSkyController);
//# sourceMappingURL=opensky.controller.js.map