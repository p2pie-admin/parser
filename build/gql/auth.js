"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const queries_1 = require("./queries");
const callStrapi_1 = __importDefault(require("./callStrapi"));
const auth = async () => {
    var _a;
    const data = await (0, callStrapi_1.default)(queries_1.AuthMutation);
    const jwt = (_a = data === null || data === void 0 ? void 0 : data.login) === null || _a === void 0 ? void 0 : _a.jwt;
    if (jwt) {
        console.log("📗 \u001b[1;32m Authorized successfully!");
        db_1.default.push(".jwt", jwt);
        db_1.default.save();
        return;
    }
    console.error("couldn't authtorize!");
};
exports.default = auth;
//# sourceMappingURL=auth.js.map