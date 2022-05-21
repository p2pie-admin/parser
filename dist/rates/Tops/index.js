"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getBest_1 = __importDefault(require("./getBest"));
const getUnique_1 = __importDefault(require("./getUnique"));
const getVerified_1 = __importDefault(require("./getVerified"));
const getDirTops = (allDirRates) => {
    return Object.keys(allDirRates).reduce((allDirTops, dir) => {
        allDirTops[dir] = _getDirTop(allDirRates[dir], dir);
        return allDirTops;
    }, {});
};
const _getDirTop = (dirRates, dir) => {
    const verifiedRates = (0, getVerified_1.default)(dirRates, dir);
    const uniqueRates = (0, getUnique_1.default)(verifiedRates);
    const bestRates = (0, getBest_1.default)(verifiedRates);
    const dirTops = {
        uniqueRates,
        bestRates,
    };
    return dirTops;
};
exports.default = getDirTops;
//# sourceMappingURL=index.js.map