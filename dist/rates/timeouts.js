"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartRatesHandlerIn = exports.expireIn = exports.timeout = void 0;
const db_1 = __importDefault(require("../db"));
const exchangers = db_1.default.getData(".exchangers");
const exchangersLength = Object.keys(exchangers).length;
const timeout = exchangersLength * 300 > 12000 ? exchangersLength * 300 : 12000;
exports.timeout = timeout;
const expireIn = timeout * 2 - 2000;
exports.expireIn = expireIn;
const restartRatesHandlerIn = timeout + 4000;
exports.restartRatesHandlerIn = restartRatesHandlerIn;
//# sourceMappingURL=timeouts.js.map