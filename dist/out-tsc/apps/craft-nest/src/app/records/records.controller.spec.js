"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const records_controller_1 = require("./records.controller");
const records_service_1 = require("./records.service");
describe('RecordsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [records_controller_1.RecordsController],
            providers: [records_service_1.RecordsService],
        }).compile();
        controller = module.get(records_controller_1.RecordsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=records.controller.spec.js.map