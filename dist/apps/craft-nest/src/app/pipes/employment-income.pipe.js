"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmploymentIncomePipe = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@angular/core");
let EmploymentIncomePipe = class EmploymentIncomePipe {
    transform(records) {
        if (!records || !Array.isArray(records)) {
            return 0; // Return a default value if records is null or not an array
        }
        return records.reduce((total, record) => total + (record.income || 0), 0);
    }
};
exports.EmploymentIncomePipe = EmploymentIncomePipe;
exports.EmploymentIncomePipe = EmploymentIncomePipe = tslib_1.__decorate([
    (0, core_1.Pipe)({
        name: 'employmentIncome'
    })
], EmploymentIncomePipe);
//# sourceMappingURL=employment-income.pipe.js.map