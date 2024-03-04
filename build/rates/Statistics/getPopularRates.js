"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPopularRates = void 0;
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
const findBestRateByDir = (dir, fiatIndex) => {
    const dirRatesExist = dbRates_1.default.exists(`.allDirsRates.${dir}`);
    if (!dirRatesExist)
        return;
    const dirRates = dbRates_1.default.getData(`.allDirsRates.${dir}`);
    const [exchangerId, rate] = [...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course)[0];
    return {
        exchangerId,
        course: fiatIndex ? 1 / rate.course : rate.course,
        fiat: dir.split("_")[fiatIndex],
    };
};
const getPopularRates = () => {
    const popularDirs = db_1.default.getData(".popular_dirs");
    return Object.entries(popularDirs).reduce((res, [cryptoCode, sides]) => {
        const [buyCourses, sellCourses] = [
            sides.buy.map((dir) => findBestRateByDir(dir, 0)),
            sides.sell.map((dir) => findBestRateByDir(dir, 1)),
        ];
        return Object.assign(Object.assign({}, res), { [cryptoCode]: { buy: buyCourses, sell: sellCourses } });
    }, {});
};
exports.getPopularRates = getPopularRates;
