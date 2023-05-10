"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DirRatesVerificator_1 = require("./DirRatesVerificator");
const findBest_1 = __importDefault(require("./findBest"));
const findUnique_1 = __importDefault(require("./findUnique"));
const testBest_1 = require("./testBest");
const dirRatesIntoArray = (dirRates) => {
    return Object.entries(dirRates).map(([exchangerId, rate]) => (Object.assign({ exchangerId }, rate)));
};
const deleteProps = (obj, prop) => {
    for (const p of prop) {
        delete obj[p];
    }
    return obj;
};
const _getDirTop = (dirRates, dir) => {
    const dirRatesVerificator = new DirRatesVerificator_1.DirRatesVerificator(dir);
    const verifiedRates = dirRatesVerificator.getVerified(dirRates);
    const uniqueRates = (0, findUnique_1.default)(verifiedRates);
    const ratesWithoutUnique = deleteProps(verifiedRates, Object.keys(uniqueRates));
    const bestRates = (0, findBest_1.default)(ratesWithoutUnique);
    (0, testBest_1.testBest)(bestRates, dir);
    const dirTops = [
        ...dirRatesIntoArray(uniqueRates),
        ...dirRatesIntoArray(bestRates),
    ];
    return dirTops;
};
const getDirTops = (allDirsRates) => {
    return Object.keys(allDirsRates).reduce((allDirTops, dir) => {
        allDirTops[dir] = _getDirTop(allDirsRates[dir], dir);
        return allDirTops;
    }, {});
};
exports.default = getDirTops;
//# sourceMappingURL=index.js.map