"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rateTransformer_1 = __importDefault(require("./rateTransformer"));
const verification_1 = __importDefault(require("./verification"));
const findUniqueRates_1 = __importDefault(require("./findUniqueRates"));
const findBestRates_1 = __importDefault(require("./findBestRates"));
const _convertDirRates = (dirRateStrings, dir) => {
    const transformedRates = (0, rateTransformer_1.default)(dirRateStrings, dir);
    const verifiedRates = (0, verification_1.default)(transformedRates, dir);
    const uniqueRates = (0, findUniqueRates_1.default)(verifiedRates);
    const bestRates = (0, findBestRates_1.default)(verifiedRates);
    const convertedDirRates = {
        rates: verifiedRates,
        uniqueRates,
        bestRates,
    };
    return convertedDirRates;
};
const convertAllRates = (allRateStrings) => {
    return Object.keys(allRateStrings).reduce((convertedRates, dir) => {
        convertedRates[dir] = _convertDirRates(allRateStrings[dir], dir);
        return convertedRates;
    }, {});
};
exports.default = convertAllRates;
//# sourceMappingURL=index.js.map