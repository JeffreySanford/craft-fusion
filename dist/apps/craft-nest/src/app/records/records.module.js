"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const records_service_1 = require("./records.service");
const records_controller_1 = require("./records.controller");
let RecordsModule = class RecordsModule {
};
exports.RecordsModule = RecordsModule;
exports.RecordsModule = RecordsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        controllers: [records_controller_1.RecordsController],
        providers: [records_service_1.RecordsService],
    })
], RecordsModule);
//# sourceMappingURL=records.module.js.map