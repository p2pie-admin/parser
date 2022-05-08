"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbRates_1 = __importDefault(require("../../dbRates"));
const ErrorCreator_1 = __importDefault(require("./ErrorCreator"));
const CitiesHandler_1 = __importDefault(require("./CitiesHandler"));
const db_1 = __importDefault(require("../../db"));
class XMLConverter {
    constructor(exchangerId) {
        this.matchXMLRatesWithDirs = (rates) => {
            const cityCodes = db_1.default.getData(".parser_setting.cities");
            rates.map(rate => {
                var _a, _b, _c, _d, _e, _f;
                try {
                    const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`;
                    const citiesHandler = new CitiesHandler_1.default();
                    const convertedDirRates = {
                        id: this.exchangerId,
                        min_fee: (_a = rate.minfee) === null || _a === void 0 ? void 0 : _a._text,
                        from_fee: (_b = rate.fromfee) === null || _b === void 0 ? void 0 : _b._text,
                        to_fee: (_c = rate.tofee) === null || _c === void 0 ? void 0 : _c._text,
                        course: Number(rate.in._text) / Number(rate.out._text),
                        param: (_d = rate.param) === null || _d === void 0 ? void 0 : _d._text,
                        cities: cityCodes && ((_e = rate.city) === null || _e === void 0 ? void 0 : _e._text) ? citiesHandler.formatCities((_f = rate.city) === null || _f === void 0 ? void 0 : _f._text, cityCodes) : null
                    };
                    dbRates_1.default.push(`.allConvertedRates.${dir}[]`, convertedDirRates);
                }
                catch (err) {
                    const errorCreator = new ErrorCreator_1.default(this.exchangerId);
                    errorCreator.saveError('unknown-error', err.code);
                }
            });
        };
        this.checkForErrors = (exchangerResponse) => {
            var _a;
            const errorCreator = new ErrorCreator_1.default(this.exchangerId);
            if (!exchangerResponse) {
                errorCreator.saveError('404');
                return false;
            }
            if (exchangerResponse.error) {
                errorCreator.saveError('error-response', (_a = exchangerResponse === null || exchangerResponse === void 0 ? void 0 : exchangerResponse.error) === null || _a === void 0 ? void 0 : _a._text);
                return false;
            }
            if (!exchangerResponse.rates) {
                errorCreator.saveError('no-rates');
                return false;
            }
            return true;
        };
        this.exchangerId = exchangerId;
    }
}
exports.default = XMLConverter;
//# sourceMappingURL=XMLConverter.js.map