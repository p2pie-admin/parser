"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getVerified_1 = __importDefault(require("./getVerified"));
const getDirTops = (allDirRates) => {
    return Object.keys(allDirRates).reduce((allDirTops, dir) => {
        _getDirTop(allDirRates[dir], dir);
        return allDirTops;
    }, {});
};
const _getDirTop = (dirRates, dir) => {
    const verifiedRates = (0, getVerified_1.default)(dirRates, dir);
    console.log('verifiedRates: ', verifiedRates);
};
exports.default = getDirTops;
//# sourceMappingURL=Filter.js.map