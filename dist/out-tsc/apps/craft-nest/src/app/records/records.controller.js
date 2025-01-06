"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsController = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const records_service_1 = require("./records.service");
let RecordsController = class RecordsController {
    constructor(recordService) {
        this.recordService = recordService;
        this.recordGenerationTime = 0;
    }
    getAllRecords() {
        console.log('Received request to get all records');
        return this.recordService.getAllRecords();
    }
    generateMultipleRecords(count) {
        console.log('Received request to generate records with count:', count);
        const recordCount = Number(count) || 10;
        return this.recordService.generateMultipleRecords(recordCount);
    }
    getTotalIncome(UID) {
        console.log('Received request to get total income for UID:', UID);
        return this.recordService.calculateTotalIncome(UID);
    }
    getCreationTime() {
        console.log('Received request to get creation time');
        return this.recordService.getCreationTime();
    }
    getUserbyId(UID) {
        console.log('Received request to get record by UID:', UID);
        // remove the colon from the UID
        const userID = UID.replace(/^:/, '');
        console.log('Processed UID:', userID);
        return this.recordService.getRecordByUID(userID);
    }
};
exports.RecordsController = RecordsController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Array)
], RecordsController.prototype, "getAllRecords", null);
tslib_1.__decorate([
    (0, common_1.Get)('generate'),
    tslib_1.__param(0, (0, common_1.Query)('count')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Array)
], RecordsController.prototype, "generateMultipleRecords", null);
tslib_1.__decorate([
    (0, common_1.Get)('total-income/:UID'),
    tslib_1.__param(0, (0, common_1.Param)('UID')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Number)
], RecordsController.prototype, "getTotalIncome", null);
tslib_1.__decorate([
    (0, common_1.Get)('time'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Number)
], RecordsController.prototype, "getCreationTime", null);
tslib_1.__decorate([
    (0, common_1.Get)(':UID'),
    tslib_1.__param(0, (0, common_1.Param)('UID')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Object)
], RecordsController.prototype, "getUserbyId", null);
exports.RecordsController = RecordsController = tslib_1.__decorate([
    (0, common_1.Controller)('records'),
    tslib_1.__metadata("design:paramtypes", [records_service_1.RecordsService])
], RecordsController);
//# sourceMappingURL=records.controller.js.map