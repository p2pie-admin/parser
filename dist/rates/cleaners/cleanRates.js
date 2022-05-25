"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanRates = void 0;
const dbRates_1 = __importDefault(require("../../dbRates"));
const cleanRates = (exchangerId) => {
    const dirRates = dbRates_1.default.getData(".dirRates");
    const cleanDirRates = Object.entries(dirRates).reduce((newDirRates, [dir, rates]) => (Object.assign(Object.assign({}, newDirRates), { [dir]: rates.filter(rate => rate.id !== exchangerId) })), {});
    dbRates_1.default.push(".dirRates", cleanDirRates);
};
exports.cleanRates = cleanRates;
//# sourceMappingURL=cleanRates.js.map