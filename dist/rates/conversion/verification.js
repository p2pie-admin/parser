"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const { SD_applied_from, SD_best_rates, SD_worst_rates } = db_1.default.getData(".preferences");
const verifyRates = (rates, dir) => {
    const [average, SD] = getAverageSD(rates);
    return rates.reduce((passedRates, rate) => {
        const { rateErrors, rateWarnings } = verifyOneRate(rate, average, SD);
        if (rateWarnings.length)
            addToProblematic(rate, "warnings", rateWarnings, dir);
        if (rateErrors.length)
            addToProblematic(rate, "errors", rateErrors, dir);
        if (!rateErrors.length)
            passedRates.push(rate);
        return passedRates;
    }, []);
};
const verifyOneRate = (rate, average, SD) => {
    const { reserve, min_amount, max_amount } = rate;
    const rateErrors = [];
    const rateWarnings = [];
    const [minCourse, maxCourse] = [
        average - SD * SD_worst_rates,
        average + SD * SD_best_rates,
    ];
    const [lowCourse, highCourse] = [
        average - SD * (SD_worst_rates > 2 ? SD_worst_rates - 1 : 2),
        average + SD * (SD_best_rates > 2 ? SD_best_rates - 1 : 2),
    ];
    const deviation = +((rate.course / average) * 100).toFixed(0);
    const errors = [
        [min_amount.give <= 0, "The MIN must be bigger than null!"],
        [reserve.give < min_amount.give, "The RESERVE is too low!"],
        [max_amount.give < min_amount.give, "The MAX is too low!"],
        [
            rate.course < minCourse,
            `Course is ${deviation}% of average, MIN is: ${minCourse}`,
        ],
        [
            rate.course > maxCourse,
            `Course is ${deviation}% of average, MAX is: ${maxCourse}`,
        ],
    ];
    const warnings = [
        [
            rate.course < lowCourse && rate.course > minCourse,
            `Course is ${deviation}% of average, too close to MIN: ${minCourse}`,
        ],
        [
            rate.course > highCourse && rate.course < maxCourse,
            `Course is ${deviation}% of average, too close to MAX: ${maxCourse}`,
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
const getAverageSD = (rates) => {
    const courses = rates.map((rate) => rate.course);
    const length = courses.length;
    if (length <= SD_applied_from)
        return [-Infinity, Infinity];
    const toCropp = Math.round(Math.pow(length, 0.5) - Math.pow(length, 0.2));
    const sorted = courses.sort((a, b) => a - b);
    const cropped = sorted.splice(toCropp, length - toCropp * 2);
    const average = cropped.reduce((sum, i) => (sum = sum + i), 0) / cropped.length;
    const SD = Math.sqrt(cropped.reduce((sum, i) => (sum = sum + (i - average) ** 2), 0) /
        (cropped.length - 1));
    return [average, SD];
};
const addToProblematic = (rate, type, texts, dir) => {
    const problematicRateExists = db_1.default.exists(`.${type}.${dir}.${rate.exchanger.name}`);
    if (!problematicRateExists)
        db_1.default.push(`.${type}.${dir}.${rate.exchanger.name}`, {
            rate,
            texts,
        });
};
exports.default = verifyRates;
//# sourceMappingURL=verification.js.map