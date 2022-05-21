"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
const initialLoader_1 = __importDefault(require("../../initialLoader"));
const getAllRates_1 = __importDefault(require("../getAllRates"));
const lockExchangersWithErrors_1 = __importDefault(require("./lockExchangersWithErrors"));
const Tops_1 = __importDefault(require("../Tops"));
exports.default = () => {
    console.log("saving rates...");
    const dirTops = (0, Tops_1.default)(dbRates_1.default.getData(".dirRates"));
    dbRates_1.default.push(".dirTops", dirTops);
    dbRates_1.default.save();
    db_1.default.save();
    const timeout = db_1.default.getData(".parser_setting.restart_after_sec");
    const timesRatesRequested = db_1.default.getData(".times_rates_requested");
    setTimeout(getAllRates_1.default, timeout * 1000);
    if (timesRatesRequested % 2 === 0) {
        console.log(`reloading settings...`);
        (0, lockExchangersWithErrors_1.default)();
        (0, initialLoader_1.default)();
    }
    if (timesRatesRequested % 8 === 0) {
    }
    console.log(`All exchangers requested, restarting in ${timeout} sec`);
};
//# sourceMappingURL=FinishParsing.js.map