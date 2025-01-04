"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHttpsOptions = getHttpsOptions;
/**
 * Retrieves the HTTPS options for the application.
 *
 * @returns The HTTPS options object containing the key and certificate.
 * key: The key file. locat is in the secrets folder.
 * cert: The certificate file. located in the secrets folder.
 * @throws An error if the key or certificate file is not found.
 *
 */
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = require("dotenv");
// Load environment variables from .env file
(0, dotenv_1.config)();
function getHttpsOptions() {
    const envPath = (0, path_1.join)(__dirname, '..', '.env');
    const keyPath = (0, path_1.join)(__dirname, '..', 'secrets', 'key.pem');
    const certPath = (0, path_1.join)(__dirname, '..', 'secrets', 'cert.pem');
    // Check for the presence of the .env file
    if ((0, fs_1.existsSync)(envPath)) {
        console.log('.env file is present');
    }
    else {
        console.log('.env file is not present');
    }
    // Check for the presence of the key.pem file
    if ((0, fs_1.existsSync)(keyPath)) {
        console.log('key.pem file is present');
    }
    else {
        console.log('key.pem file is not present');
    }
    // Check for the presence of the cert.pem file
    if ((0, fs_1.existsSync)(certPath)) {
        console.log('cert.pem file is present');
    }
    else {
        console.log('cert.pem file is not present');
    }
    return {
        key: (0, fs_1.existsSync)(keyPath) ? (0, fs_1.readFileSync)(keyPath) : undefined,
        cert: (0, fs_1.existsSync)(certPath) ? (0, fs_1.readFileSync)(certPath) : undefined,
    };
}
//# sourceMappingURL=http-options.js.map