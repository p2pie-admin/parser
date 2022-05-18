"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const CitiesHandler_1 = __importDefault(require("./CitiesHandler"));
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
class XMLConverter {
    constructor(exchangerId) {
        this.transformLimit = (limit, course, dir) => {
            if (!limit)
                return { give: 0, get: 0 };
            const limitCur = limit.split(" ")[1];
            const limitValue = parseFloat(limit);
            const [givePm, getPm] = dir.split("_");
            console.log("givePm ", givePm);
            console.log("getPm ", getPm);
            console.log("limitValue ", limitValue);
            console.log("course ", course);
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
        this.matchXMLRatesWithDirs = (rates) => {
            const cityCodes = db_1.default.getData(".parser_setting.cities");
            const dirs_disabled = db_1.default.getData(".parser_setting.dirs_disabled");
            const possible_pm_codes = db_1.default.getData(".possible_pm_codes");
            let rateDataError = false;
            rates.map(rate => {
                var _a, _b, _c;
                try {
                    const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`;
                    if (!possible_pm_codes.find(code => code === rate.from._text.toUpperCase()))
                        return;
                    if (!possible_pm_codes.find(code => code === rate.to._text.toUpperCase()))
                        return;
                    if (dirs_disabled.split("\n").find(dir_disabled => dir_disabled.toUpperCase() === dir))
                        return;
                    const course = Number(rate.in._text) / Number(rate.out._text);
                    const [min_fee, from_fee, to_fee, min, max] = ["minfee", "fromfee", "tofee", "min", "max"]
                        .map((limit) => { var _a; return this.transformLimit((_a = rate[limit]) === null || _a === void 0 ? void 0 : _a._text, +course, dir); });
                    const reserve = this.transformLimit(`${rate.amount._text} ${dir.split("_")[1]}`, +course, dir);
                    const citiesHandler = new CitiesHandler_1.default();
                    const convertedDirRates = {
                        id: this.exchangerId,
                        min_fee,
                        from_fee,
                        to_fee,
                        course,
                        min,
                        max,
                        reserve,
                        param: (_a = rate.param) === null || _a === void 0 ? void 0 : _a._text,
                        cities: cityCodes && ((_b = rate.city) === null || _b === void 0 ? void 0 : _b._text) ? citiesHandler.formatCities((_c = rate.city) === null || _c === void 0 ? void 0 : _c._text, cityCodes) : null
                    };
                    dbRates_1.default.push(`.allConvertedRates.${dir}[]`, convertedDirRates);
                }
                catch (err) {
                    rateDataError = true;
                }
            });
            if (rateDataError) {
                const errorHandler = new ErrorHandler_1.default(this.exchangerId);
                errorHandler.saveError('data-error');
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
exports.default = XMLConverter;
//# sourceMappingURL=XMLConverter.js.map