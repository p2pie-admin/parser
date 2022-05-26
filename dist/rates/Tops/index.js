"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DirRatesVerificator_1 = require("./DirRatesVerificator");
const findBest_1 = __importDefault(require("./findBest"));
const findUnique_1 = __importDefault(require("./findUnique"));
const getDirTops = (allDirRates) => {
    return Object.keys(allDirRates).reduce((allDirTops, dir) => {
        allDirTops[dir] = _getDirTop(allDirRates[dir], dir);
        return allDirTops;
    }, {});
};
const _getDirTop = (dirRates, dir) => {
    const dirRatesVerificator = new DirRatesVerificator_1.DirRatesVerificator(dir);
    const verifiedRates = dirRatesVerificator.getVerified(dirRates);
    const bestRates = (0, findBest_1.default)(verifiedRates);
    const uniqueRates = (0, findUnique_1.default)(verifiedRates);
    const dirTops = {
        uniqueRates,
        bestRates,
    };
    return dirTops;
};
exports.default = getDirTops;
//# sourceMappingURL=index.js.map