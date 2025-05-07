"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../../redis");
const helper_1 = require("../../helper");
const dirsExistHandler = async () => {
    const allDirTops = (await (0, redis_1.getObject)("allDirTops"));
    const allPmCodesThatExist = (await (0, redis_1.getData)("all_pm_codes_that_exist"));
    if (!allDirTops || !allPmCodesThatExist) {
        (0, helper_1.mylog)("No dirs exist yet!", "warning");
        return;
    }
    const possibleEverDirs = allPmCodesThatExist.reduce((res, leftCode) => [
        ...res,
        ...allPmCodesThatExist.map((rightCode) => `${leftCode}_${rightCode}`),
    ], []); // getting all possible pairs [A]_[B]
    const possiblePairs = possibleEverDirs.reduce((pairs, directionKey) => {
        const directionRates = allDirTops[directionKey];
        // возможно такое, что при билде фронта курсов нет, а потом он появится
        // и потом в селекторе его можно будет выбрать, а при билде его не было значит 404
        // поэтому сделаем хотя бы 2 курса чтобы было для минимизации таких кейсов
        if (!directionRates || Object.keys(directionRates).length < 3)
            return pairs;
        const [leftPm, rightPm] = directionKey.split("_");
        if (!leftPm || !rightPm)
            return pairs; // Handle malformed strings
        pairs[leftPm] = pairs[leftPm] ? [...pairs[leftPm], rightPm] : [rightPm];
        return pairs;
    }, {});
    (0, redis_1.setData)("possible_pairs", possiblePairs);
};
exports.default = dirsExistHandler;
