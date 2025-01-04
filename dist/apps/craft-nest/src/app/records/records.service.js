"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const faker_1 = require("@faker-js/faker");
let RecordsService = class RecordsService {
    constructor() {
        this.mockDatabase = [];
        this.recordGenerationTime = 0;
    }
    getRecordByUID(UID) {
        // Mock database fetch
        const record = this.mockDatabase.find(record => record.UID === UID);
        if (!record) {
            throw new Error(`Record with UID ${UID} not found`);
        }
        return record;
    }
    getAllRecords() {
        // Mock database fetch
        return this.mockDatabase;
    }
    calculateTotalIncome(UID) {
        const record = this.getRecordByUID(UID);
        if (record) {
            return record.salary.reduce((acc, companySalary) => acc + companySalary.annualSalary, 0);
        }
        return 0;
    }
    generateCompany() {
        return {
            companyName: faker_1.faker.company.name(),
            annualSalary: faker_1.faker.number.int({ min: 30000, max: 500000 }),
        };
    }
    generatePhone() {
        const rawPhoneNumber = '##########'.replace(/#/g, () => faker_1.faker.number.int({ max: 9 }).toString());
        const formattedPhoneNumber = rawPhoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        const areaCode = faker_1.faker.phone.number().slice(0, 3);
        const hasExtension = faker_1.faker.datatype.boolean();
        const extension = hasExtension ? faker_1.faker.number.int({ min: 1000, max: 9999 }).toString() : null;
        const phone = {
            number: formattedPhoneNumber,
            areaCode,
            hasExtension,
            extension
        };
        return phone;
    }
    generateAddress() {
        const address = {
            street: faker_1.faker.location.streetAddress(),
            city: faker_1.faker.location.city(),
            state: faker_1.faker.location.state(),
            zipcode: faker_1.faker.location.zipCode()
        };
        return address;
    }
    generateRecord() {
        const generateRecord = {
            UID: faker_1.faker.number.int({ min: 100000000, max: 999999999 }).toString(),
            firstName: faker_1.faker.person.firstName(),
            lastName: faker_1.faker.person.lastName(),
            address: this.generateAddress(),
            phone: this.generatePhone(),
            salary: Array.from({ length: faker_1.faker.number.int({ min: 1, max: 5 }) }, () => this.generateCompany()),
            totalHouseholdIncome: faker_1.faker.number.int({ min: 50000, max: 50000000 }),
        };
        return generateRecord;
    }
    generateMultipleRecords(count) {
        const startTime = performance.now();
        this.mockDatabase = Array.from({ length: count }, () => this.generateRecord());
        const endTime = performance.now();
        this.recordGenerationTime = endTime - startTime;
        console.log('Generated ' + count + ' records');
        return this.mockDatabase;
    }
    getCreationTime() {
        return this.recordGenerationTime;
    }
};
exports.RecordsService = RecordsService;
exports.RecordsService = RecordsService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], RecordsService);
//# sourceMappingURL=records.service.js.map