"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSkyService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const operators_1 = require("rxjs/operators");
let OpenSkyService = class OpenSkyService {
    constructor(httpService) {
        this.httpService = httpService;
        this.API_URL = 'https://opensky-network.org/api/states/all';
    }
    fetchFlightData() {
        return this.httpService.get(this.API_URL).pipe((0, operators_1.map)(response => response.data.states || []));
    }
    fetchAirportData() {
        return this.httpService.get('https://api.opensky-network.org/airports')
            .pipe((0, operators_1.map)(response => response.data));
    }
    fetchFlightDataByAirline(airline) {
        return this.httpService.get(`https://api.opensky-network.org/flights/airline?icao=${airline}`)
            .pipe((0, operators_1.map)(response => response.data));
    }
    fetchFlightDataByAircraft(aircraft) {
        return this.httpService.get(`https://api.opensky-network.org/flights/aircraft?icao24=${aircraft}`)
            .pipe((0, operators_1.map)(response => response.data));
    }
};
exports.OpenSkyService = OpenSkyService;
exports.OpenSkyService = OpenSkyService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [axios_1.HttpService])
], OpenSkyService);
//# sourceMappingURL=opensky.service.js.map