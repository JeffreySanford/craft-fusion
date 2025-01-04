"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_service_1 = require("./app.service");
describe('AppService', () => {
    let service;
    beforeAll(async () => {
        const app = await testing_1.Test.createTestingModule({
            providers: [app_service_1.AppService],
        }).compile();
        service = app.get(app_service_1.AppService);
    });
    describe('getData', () => {
        it('should return "Hello API"', () => {
            expect(service.getData()).toEqual({ message: 'Hello API' });
        });
    });
});
//# sourceMappingURL=app.service.spec.js.map