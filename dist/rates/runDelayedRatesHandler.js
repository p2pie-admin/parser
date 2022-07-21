"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const dbRates_1 = __importDefault(require("../dbRates"));
const lockExchangersWithErrors_1 = __importDefault(require("./cleaners/lockExchangersWithErrors"));
const Tops_1 = __importDefault(require("./Tops"));
const initialLoader_1 = __importDefault(require("../initialLoader"));
const timeouts_1 = require("./timeouts");
const runDelayedRatesHandler = () => {
    console.log(`\u001b[1;34m Анализ курсов начнется через ${timeouts_1.restartRatesHandlerIn / 1000}c`);
    setTimeout(() => {
        const allDirsRates = dbRates_1.default.getData(".allDirsRates");
        const allDirsTops = (0, Tops_1.default)(allDirsRates);
        (0, lockExchangersWithErrors_1.default)();
        dbRates_1.default.push(".allDirsTops", allDirsTops);
        dbRates_1.default.save();
        db_1.default.save();
        (0, initialLoader_1.default)();
        runDelayedRatesHandler();
    }, timeouts_1.restartRatesHandlerIn);
};
exports.default = runDelayedRatesHandler;
//# sourceMappingURL=runDelayedRatesHandler.js.map