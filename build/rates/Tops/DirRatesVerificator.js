"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = exports.DirRatesVerificator = void 0;
const ErrorHandler_1 = require("../ErrorHandler");
class DirRatesVerificator {
    constructor(dir, SD_applied_from, SD_best, SD_worst) {
        this.getVerified = (dirRates) => {
            const [average, SD] = this._getAverageAndSD(dirRates);
            const okDirRates = Object.entries(dirRates).reduce((res, [exchangerId, rate]) => {
                const hasWarnings = this._verifyRate(rate, average, SD, Object.keys(dirRates).length);
                if (!hasWarnings)
                    return { ...res, [exchangerId]: rate };
                return res;
            }, {});
            return okDirRates;
        };
        this._verifyRate = (rate, average, SD, ratesAmount) => {
            const { min, max } = rate;
            let hasWarnings = false;
            const [fromCurrency] = this.dir.split("_");
            const [minCourse, maxCourse] = [
                average - SD * this.SD_worst,
                average + SD * this.SD_best,
            ];
            const [lowCourse, highCourse] = [
                average - SD * (this.SD_worst > 2 ? this.SD_worst - 1 : 2),
                average + SD * (this.SD_best > 2 ? this.SD_best - 1 : 2),
            ];
            const deviation = average === 0 ? 0 : +((rate.course / average - 1) * 100).toFixed(0);
            const warnings = [
                [rate.course === 0, ` Курс не может быть нулевым`],
                [min.give <= 0, ` Минимум должен быть больше нуля`],
                [
                    max.give < min.give,
                    ` Максималка ${(0, exports.round)(rate.max.give)} ${fromCurrency} меньше минималки ${(0, exports.round)(rate.min.give)} ${fromCurrency}`,
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
            const easyWarnings = [
                [
                    rate.course < lowCourse && rate.course > minCourse,
                    ` Курс ${(0, exports.round)(rate.course)} на ${deviation}% меньше среднего ${(0, exports.round)(average)} от ${(0, exports.round)(ratesAmount)} предложений, близко к MIN границе: ${(0, exports.round)(minCourse)} `,
                ],
                [
                    rate.course > highCourse && rate.course < maxCourse,
                    ` Курс ${(0, exports.round)(rate.course)} на ${deviation}% больше среднего ${(0, exports.round)(average)} от ${(0, exports.round)(ratesAmount)} предложений, близко к MAX границе: ${(0, exports.round)(maxCourse)} `,
                ],
            ];
            for (let [condition, message] of warnings) {
                if (condition && rate.exchangerId) {
                    (0, ErrorHandler_1.sendExchangerWarning)(rate.exchangerId, this.dir, message);
                    hasWarnings = true;
                }
            }
            for (let [condition, message] of easyWarnings) {
                if (condition && rate.exchangerId) {
                    (0, ErrorHandler_1.sendExchangerWarning)(rate.exchangerId, this.dir, message);
                }
            }
            return hasWarnings;
        };
        this._getAverageAndSD = (dirRates) => {
            const courses = Object.values(dirRates)
                .map((rate) => rate.course)
                .filter((c) => c > 0);
            const length = courses.length;
            if (length <= this.SD_applied_from) {
                // fallback: return wide threshold
                const avg = courses.reduce((sum, c) => sum + c, 0) / (courses.length || 1);
                return [avg, Infinity];
            }
            const toCrop = Math.round(Math.pow(length, 0.5) - Math.pow(length, 0.2));
            const sorted = courses.slice().sort((a, b) => a - b);
            const cropped = sorted.slice(toCrop, length - toCrop);
            const average = cropped.reduce((sum, val) => sum + val, 0) / cropped.length;
            const SD = cropped.length > 1
                ? Math.sqrt(cropped.reduce((sum, val) => sum + (val - average) ** 2, 0) /
                    (cropped.length - 1))
                : 0;
            return [average, SD];
        };
        this.dir = dir;
        this.SD_applied_from = SD_applied_from;
        this.SD_best = SD_best;
        this.SD_worst = SD_worst;
    }
}
exports.DirRatesVerificator = DirRatesVerificator;
const round = (amount) => {
    if (!amount)
        return 0;
    if (amount > 1000)
        return +amount.toFixed(0);
    if (amount > 10)
        return +amount.toFixed(2);
    if (amount > 1)
        return +amount.toFixed(4);
    return +amount.toFixed(6);
};
exports.round = round;
