"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosGet = axiosGet;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
async function axiosGet(url, config) {
    return axios_1.default.get(url, config);
}
// ...existing code...
//# sourceMappingURL=axios-related-file.js.map