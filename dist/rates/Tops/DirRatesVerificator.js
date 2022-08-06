"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirRatesVerificator = void 0;
const db_1 = __importDefault(require("../../db"));
class DirRatesVerificator {
    constructor(dir) {
        this.getVerified = (dirRates) => {
            const [average, SD] = this._getAverageAndSD(dirRates);
            const okDirRates = Object.entries(dirRates).reduce((okDirRates, [exchangerId, rate]) => {
                const { rateErrors, rateWarnings } = this._verifyRate(rate, average, SD, Object.keys(dirRates).length);
                if (rateWarnings.length)
                    db_1.default.push(`.dirs.${this.dir}.warnings.${exchangerId}`, rateWarnings);
                if (rateErrors.length)
                    db_1.default.push(`.dirs.${this.dir}.errors.${exchangerId}`, rateErrors);
                if (!rateErrors.length)
                    okDirRates[exchangerId] = rate;
                return okDirRates;
            }, {});
            return okDirRates;
        };
        this._verifyRate = (rate, average, SD, ratesAmount) => {
            const { reserve, min, max } = rate;
            let rateErrors = [];
            let rateWarnings = [];
            const [minCourse, maxCourse] = [
                average - SD * this.SD_worst,
                average + SD * this.SD_best,
            ];
            const [lowCourse, highCourse] = [
                average - SD * (this.SD_worst > 2 ? this.SD_worst - 1 : 2),
                average + SD * (this.SD_best > 2 ? this.SD_best - 1 : 2),
            ];
            const deviation = +((rate.course / average) * 100).toFixed(0);
            const rate_errors = [
                [min.give <= 0, ` Минимум должен быть больше нуля`],
                [
                    reserve.give < min.give,
                    ` Резерв ${rate.reserve.give} меньше минималки ${rate.min.give} `,
                ],
                [
                    max.give < min.give,
                    ` Максималка ${rate.max.give} меньше минималки ${rate.min.give} `,
                ],
                [
                    rate.course < minCourse,
                    ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, MIN: ${minCourse} `,
                ],
                [
                    rate.course > maxCourse,
                    ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, MAX: ${maxCourse} `,
                ],
            ];
            const warnings = [
                [
                    rate.course < lowCourse && rate.course > minCourse,
                    ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, слишком близко к MIN: ${minCourse} `,
                ],
                [
                    rate.course > highCourse && rate.course < maxCourse,
                    ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, слишком близко к MAX: ${maxCourse} `,
                ],
            ];
            for (let rate_error of rate_errors) {
                const [errorCondition, message] = rate_error;
                if (errorCondition) {
                    rateErrors = [...rateErrors, message];
                }
            }
            for (let warning of warnings) {
                const [warningCondition, message] = warning;
                if (warningCondition) {
                    rateWarnings = [...rateWarnings, message];
                }
            }
            return {
                rateErrors,
                rateWarnings,
            };
        };
        this._getAverageAndSD = (dirRates) => {
            const courses = Object.values(dirRates).map((rate) => rate.course);
            const length = courses.length;
            if (length <= this.SD_applied_from)
                return [0, Infinity];
            const toCropp = Math.round(Math.pow(length, 0.5) - Math.pow(length, 0.2));
            const sorted = courses.sort((a, b) => a - b);
            const cropped = sorted.splice(toCropp, length - toCropp * 2);
            const average = cropped.reduce((sum, i) => (sum = sum + i), 0) / cropped.length;
            const SD = Math.sqrt(cropped.reduce((sum, i) => (sum = sum + (i - average) ** 2), 0) /
                (cropped.length - 1));
            return [average, SD];
        };
        this._addToProblematic = () => { };
        const { SD_applied_from, SD_best, SD_worst } = db_1.default.getData(".parser_setting");
        this.dir = dir;
        this.SD_applied_from = SD_applied_from;
        this.SD_best = SD_best;
        this.SD_worst = SD_worst;
    }
}
exports.DirRatesVerificator = DirRatesVerificator;
//# sourceMappingURL=DirRatesVerificator.js.map