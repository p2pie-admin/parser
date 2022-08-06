"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
class CitiesHandler {
    constructor() {
        this.groupRatesDataCities = (exchangerId, ratesData) => {
            try {
                return ratesData.reduce((groupedRatesData, rateData) => {
                    var _a, _b;
                    const sameDir = groupedRatesData.findIndex((rv) => rv.from._text === rateData.from._text &&
                        rv.to._text === rateData.to._text &&
                        rateData.city);
                    sameDir === -1
                        ? groupedRatesData.push(rateData)
                        : (groupedRatesData[sameDir].city = {
                            _text: ((_a = groupedRatesData[sameDir].city) === null || _a === void 0 ? void 0 : _a._text) +
                                "/" +
                                ((_b = rateData.city) === null || _b === void 0 ? void 0 : _b._text),
                        });
                    return groupedRatesData;
                }, []);
            }
            catch (err) {
                const exchangerHandler = new ErrorHandler_1.default(exchangerId);
                exchangerHandler.saveError("data-error", err.message);
                return [];
            }
        };
        this.formatCities = (cities, cityList) => {
            return cities
                .split("/")
                .reduce((accumulator, cityCode) => {
                let [city, country] = cityList[cityCode]
                    ? cityList[cityCode].split(",")
                    : [null, null];
                if (city && country) {
                    country = country.replace(" ", "");
                    accumulator[country] = accumulator[country]
                        ? [...accumulator[country], city]
                        : [city];
                }
                return accumulator;
            }, {});
        };
    }
}
exports.default = CitiesHandler;
//# sourceMappingURL=CitiesHandler.js.map