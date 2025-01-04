"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecordDto = void 0;
class CreateRecordDto {
    constructor() {
        this.UID = '';
        this.name = '';
        this.firstName = '';
        this.lastName = '';
        this.address = { street: '', city: '', state: '', zipcode: '' };
        this.phone = { number: '', hasExtension: false, extension: null, areaCode: '' };
        this.salary = [];
        this.totalHouseholdIncome = 0;
    }
}
exports.CreateRecordDto = CreateRecordDto;
//# sourceMappingURL=create-record.dto.js.map