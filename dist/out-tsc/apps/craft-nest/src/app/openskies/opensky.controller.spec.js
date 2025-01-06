"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const opensky_controller_1 = require("./opensky.controller");
const opensky_service_1 = require("./opensky.service");
const axios_1 = require("@nestjs/axios");
class MockHttpService {
}
describe('OpenskyController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [axios_1.HttpModule],
            controllers: [opensky_controller_1.OpenSkyController],
            providers: [
                opensky_service_1.OpenSkyService,
                {
                    provide: MockHttpService,
                    useClass: MockHttpService,
                },
            ],
        }).compile();
        controller = module.get(opensky_controller_1.OpenSkyController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=opensky.controller.spec.js.map