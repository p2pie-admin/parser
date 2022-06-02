"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
exports.default = () => {
    const exchangers = db_1.default.getData('.exchangers');
    const exchangersLength = Object.keys(exchangers).length;
    const timeout = exchangersLength * 300 > 12000 ? exchangersLength * 300 : 12000;
    const expireIn = timeout - 2000;
    const restartRatesHandlerIn = timeout + 4000;
    return { timeout, expireIn, restartRatesHandlerIn };
};
//# sourceMappingURL=getTimeouts.js.map