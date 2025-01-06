"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let UsersService = class UsersService {
    findOne(username) {
        return new rxjs_1.Observable(observer => {
            observer.next({ id: 0, username: username, password: 'changeme' });
            observer.complete();
        });
    }
    create(user) {
        return new rxjs_1.Observable(observer => {
            observer.next(user);
            observer.complete();
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map