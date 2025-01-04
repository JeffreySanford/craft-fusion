"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecordDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_record_dto_1 = require("./create-record.dto");
class UpdateRecordDto extends (0, mapped_types_1.PartialType)(create_record_dto_1.CreateRecordDto) {
}
exports.UpdateRecordDto = UpdateRecordDto;
//# sourceMappingURL=update-record.dto.js.map