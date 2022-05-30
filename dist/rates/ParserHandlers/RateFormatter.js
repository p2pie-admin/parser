"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const CitiesHandler_1 = __importDefault(require("./CitiesHandler"));
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
class RateFormatter {
    constructor(exchangerId) {
        this.transformLimit = (limit, course, dir) => {
            const limitCur = limit.split(" ")[1];
            const limitValue = parseFloat(limit);
            const [givePm, getPm] = dir.split("_");
            const give = givePm.includes(limitCur)
                ? limitValue
                : getPm.includes(limitCur)
                    ? limitValue * course
                    : 0;
            const get = getPm.includes(limitCur)
                ? limitValue
                : givePm.includes(limitCur)
                    ? limitValue / course
                    : 0;
            return { give, get };
        };
        this.formatAndMatchRatesWithDirs = (rates) => {
            const cityCodes = db_1.default.getData(".parser_setting.cities");
            const dirs_disabled = db_1.default.getData(".parser_setting.dirs_disabled");
            const possible_pm_codes = db_1.default.getData(".possible_pm_codes");
            let rateDataError = false;
            rates.map(rate => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                try {
                    const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`;
                    if (!possible_pm_codes.find(code => code === rate.from._text.toUpperCase()))
                        return;
                    if (!possible_pm_codes.find(code => code === rate.to._text.toUpperCase()))
                        return;
                    if (dirs_disabled.split("\n").find(dir_disabled => dir_disabled.toUpperCase() === dir))
                        return;
                    const course = +rate.in._text / +rate.out._text;
                    const min = this.transformLimit(rate.minamount._text, +course, dir);
                    const max = this.transformLimit(rate.maxamount._text, +course, dir);
                    const reserve = this.transformLimit(`${rate.amount._text} ${dir.split("_")[1]}`, +course, dir);
                    const citiesHandler = new CitiesHandler_1.default();
                    const cities = Object.keys(cityCodes).length && ((_a = rate.city) === null || _a === void 0 ? void 0 : _a._text) && citiesHandler.formatCities((_b = rate.city) === null || _b === void 0 ? void 0 : _b._text, cityCodes);
                    const dirRate = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (((_c = rate.minfee) === null || _c === void 0 ? void 0 : _c._text) && parseFloat((_d = rate.minfee) === null || _d === void 0 ? void 0 : _d._text) > 0 ? { min_fee: rate.minfee._text } : {})), (((_e = rate.fromfee) === null || _e === void 0 ? void 0 : _e._text) && parseFloat((_f = rate.fromfee) === null || _f === void 0 ? void 0 : _f._text) > 0 ? { from_fee: rate.fromfee._text } : {})), (((_g = rate.tofee) === null || _g === void 0 ? void 0 : _g._text) && parseFloat((_h = rate.tofee) === null || _h === void 0 ? void 0 : _h._text) > 0 ? { to_fee: rate.tofee._text } : {})), { course,
                        min, max: max.give > reserve.give ? reserve : max, reserve }), (((_j = rate.param) === null || _j === void 0 ? void 0 : _j._text) ? { param: rate.param._text } : {})), (cities ? { cities } : {}));
                    dbRates_1.default.push(`.allDirsRates.${dir}.${this.exchangerId}`, dirRate);
                }
                catch (err) {
                    rateDataError = true;
                }
            });
            if (rateDataError) {
                const errorHandler = new ErrorHandler_1.default(this.exchangerId);
                errorHandler.saveError('data-error', "Данные курсов частично отсутствуют или имеют некорректный формат");
            }
        };
        this.checkForErrors = (exchangerResponse) => {
            var _a, _b, _c;
            const errorHandler = new ErrorHandler_1.default(this.exchangerId);
            if (!exchangerResponse) {
                errorHandler.saveError('404');
                return false;
            }
            if (exchangerResponse.error) {
                errorHandler.saveError("exchanger-custom-error", (_a = exchangerResponse === null || exchangerResponse === void 0 ? void 0 : exchangerResponse.error) === null || _a === void 0 ? void 0 : _a._text);
                return false;
            }
            if (!((_c = (_b = exchangerResponse.rates) === null || _b === void 0 ? void 0 : _b.item) === null || _c === void 0 ? void 0 : _c.length)) {
                errorHandler.saveError('no-rates');
                return false;
            }
            return true;
        };
        this.exchangerId = exchangerId;
    }
}
exports.default = RateFormatter;
//# sourceMappingURL=RateFormatter.js.map