"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = exports.DirRatesVerificator = void 0;
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
            const { min, max } = rate;
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
            const deviation = +((rate.course / average - 1) * 100).toFixed(0);
            const rate_errors = [
                [min.give <= 0, ` Минимум должен быть больше нуля`],
                [
                    max.give < min.give,
                    ` Максималка ${(0, exports.round)(rate.max.give)} ${this.dir.split("_")[0]} меньше минималки ${(0, exports.round)(rate.min.give)} ${this.dir.split("_")[0]}`,
                ],
                [
                    rate.course < minCourse,
                    ` Курс ${(0, exports.round)(rate.course)} на ${deviation}% меньше среднего ${(0, exports.round)(average)} от ${ratesAmount} предложений, MIN: ${(0, exports.round)(minCourse)} `,
                ],
                [
                    rate.course > maxCourse,
                    ` Курс ${(0, exports.round)(rate.course)} на ${deviation}% больше среднего ${(0, exports.round)(average)} от ${ratesAmount} предложений, MAX: ${(0, exports.round)(maxCourse)} `,
                ],
            ];
            const warnings = [
                [
                    rate.course < lowCourse && rate.course > minCourse,
                    ` Курс ${(0, exports.round)(rate.course)} на ${deviation}% меньше среднего ${(0, exports.round)(average)} от ${(0, exports.round)(ratesAmount)} предложений, близко к MIN границе: ${(0, exports.round)(minCourse)} `,
                ],
                [
                    rate.course > highCourse && rate.course < maxCourse,
                    ` Курс ${(0, exports.round)(rate.course)} на ${deviation}% больше среднего ${(0, exports.round)(average)} от ${(0, exports.round)(ratesAmount)} предложений, близко к MAX границе: ${(0, exports.round)(maxCourse)} `,
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
const round = (amount) => {
    const factor = 4;
    if (amount === 0)
        return 0;
    const orderOfMagnitude = -Math.floor(Math.log10(amount / 10 ** factor));
    return +amount.toFixed(orderOfMagnitude < 0 ? 0 : orderOfMagnitude);
};
exports.round = round;
//# sourceMappingURL=DirRatesVerificator.js.map