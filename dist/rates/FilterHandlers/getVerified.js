"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const ErrorHandler_1 = __importDefault(require("../ParserHandlers/ErrorHandler"));
const { SD_applied_from, SD_best_dirRates, SD_worst_dirRates } = db_1.default.getData(".parser_setting");
const getVerified = (dirRates, dir) => {
    const [average, SD] = getAverageAndSD(dirRates);
    return dirRates.reduce((okDirRates, rate) => {
        const { rateErrors, rateWarnings } = verifyOneDirRate(rate, average, SD, dir);
        if (rateWarnings.length)
            addToProblematic(rate, "warnings", rateWarnings, dir);
        if (rateErrors.length)
            addToProblematic(rate, "errors", rateErrors, dir);
        if (!rateErrors.length)
            okDirRates.push(rate);
        return okDirRates;
    }, []);
};
const verifyOneDirRate = (rate, average, SD, dir) => {
    const { reserve, min, max } = rate;
    const rateErrors = [];
    const rateWarnings = [];
    const [minCourse, maxCourse] = [
        average - SD * SD_worst_dirRates,
        average + SD * SD_best_dirRates,
    ];
    const [lowCourse, highCourse] = [
        average - SD * (SD_worst_dirRates > 2 ? SD_worst_dirRates - 1 : 2),
        average + SD * (SD_best_dirRates > 2 ? SD_best_dirRates - 1 : 2),
    ];
    const deviation = +((rate.course / average) * 100).toFixed(0);
    const errors = [
        [min.give <= 0, `Минимум должен быть больше нуля в ${dir}`],
        [reserve.give < min.give, `Резерв ${rate.reserve.give} меньше минималки ${rate.min.give} в ${dir}`],
        [max.give < min.give, `Максималка ${rate.max.give} меньше минималки ${rate.min.give} в ${dir}`],
        [
            rate.course < minCourse,
            `Курс составляет ${deviation}% от среднего, MIN: ${minCourse} в ${dir}`,
        ],
        [
            rate.course > maxCourse,
            `Курс составляет ${deviation}% от среднего, MAX: ${maxCourse} в ${dir}`,
        ],
    ];
    const warnings = [
        [
            rate.course < lowCourse && rate.course > minCourse,
            `Курс составляет ${deviation}% от среднего, близко к MIN: ${minCourse} в ${dir}`,
        ],
        [
            rate.course > highCourse && rate.course < maxCourse,
            `Курс составляет ${deviation}% от среднего, близко к MAX: ${maxCourse} в ${dir}`,
        ],
    ];
    for (let error of errors) {
        const [errorCondition, message] = error;
        if (errorCondition) {
            rateErrors.push(message);
        }
    }
    for (let warning of warnings) {
        const [warningCondition, message] = warning;
        if (warningCondition) {
            rateWarnings.push(message);
        }
    }
    return {
        rateErrors,
        rateWarnings,
    };
};
const getAverageAndSD = (dirRates) => {
    const courses = dirRates.map((rate) => rate.course);
    const length = courses.length;
    if (length <= SD_applied_from)
        return [0, Infinity];
    const toCropp = Math.round(Math.pow(length, 0.5) - Math.pow(length, 0.2));
    const sorted = courses.sort((a, b) => a - b);
    const cropped = sorted.splice(toCropp, length - toCropp * 2);
    const average = cropped.reduce((sum, i) => (sum = sum + i), 0) / cropped.length;
    const SD = Math.sqrt(cropped.reduce((sum, i) => (sum = sum + (i - average) ** 2), 0) /
        (cropped.length - 1));
    return [average, SD];
};
const addToProblematic = (dirRate, type, texts, dir) => {
    const problematicDirRateExists = db_1.default.exists(`.${type}.${dir}.${dirRate.id}`);
    if (!problematicDirRateExists) {
        const errorCreator = new ErrorHandler_1.default(dirRate.id, type);
        errorCreator.saveError("data-error", JSON.stringify(texts));
    }
};
exports.default = getVerified;
//# sourceMappingURL=getVerified.js.map