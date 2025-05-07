"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirTop = void 0;
const DirRatesVerificator_1 = require("./DirRatesVerificator");
const findBest_1 = __importDefault(require("./findBest"));
const findUnique_1 = __importDefault(require("./findUnique"));
const dirRatesIntoArray = (dirRates) => {
    return Object.entries(dirRates).map(([exchangerId, rate]) => ({
        exchangerId,
        ...rate,
    }));
};
const deleteProps = (obj, prop) => {
    for (const p of prop) {
        delete obj[p];
    }
    return obj;
};
const getAllDirTops = async (allDirsRates, parserSetting) => {
    return Object.keys(allDirsRates).reduce(async (allDirTopsPromise, dir) => {
        const allDirTops = await allDirTopsPromise;
        allDirTops[dir] = await (0, exports.getDirTop)(allDirsRates[dir], parserSetting, dir);
        return allDirTops;
    }, Promise.resolve({}));
};
const getDirTop = async (rates, parserSetting, dir) => {
    // several steps to transform, sort and filter rates
    const { SD_applied_from, SD_best, SD_worst } = parserSetting;
    const ratesVerificator = new DirRatesVerificator_1.DirRatesVerificator(dir, SD_applied_from, SD_best, SD_worst);
    const verifiedRates = ratesVerificator.getVerified(rates);
    const uniqueRates = await (0, findUnique_1.default)(verifiedRates);
    // // const ratesWithoutUnique = deleteProps(
    // //   verifiedRates,
    // //   Object.keys(uniqueRates)
    // // );
    const bestRates = (0, findBest_1.default)(verifiedRates);
    // mylog(
    //   `Without unique rates: ${Object.keys(ratesWithoutUnique.length)}`,
    //   "info"
    // );
    //mylog(`Best rates: ${Object.keys(bestRates.length)}`, "info");
    const allRates = {
        ...bestRates,
        ...uniqueRates,
    };
    const dirTops = Object.values(allRates).sort((a, b) => a.course - b.course);
    return dirTops;
};
exports.getDirTop = getDirTop;
exports.default = getAllDirTops;
