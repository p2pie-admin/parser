"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rateTransformer_1 = __importDefault(require("./rateTransformer"));
const helper_1 = require("../helper");
const _convertDirRates = (dirRateStrings) => {
    const transformedRates = (0, rateTransformer_1.default)(dirRateStrings);
    return transformedRates;
};
const convertAllRates = (allRates) => {
    return (0, helper_1.applyFunctionToObjectValues)(_convertDirRates, allRates);
};
exports.default = convertAllRates;
//# sourceMappingURL=index.js.map