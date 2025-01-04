"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const environment_1 = require("../environments/environment");
exports.default = () => ({
    apiUrl: environment_1.environment.apiUrl ?? 'http://localhost',
    secure: environment_1.environment.production ?? false,
    host: environment_1.environment.host ?? 'localhost',
    nestPort: environment_1.environment.port ?? '3000'
    // ...other configurations
});
//# sourceMappingURL=configuration.js.map