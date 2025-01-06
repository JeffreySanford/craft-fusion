"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const records_service_1 = require("./records.service");
describe('RecordsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [records_service_1.RecordsService],
        }).compile();
        service = module.get(records_service_1.RecordsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=records.service.spec.js.map