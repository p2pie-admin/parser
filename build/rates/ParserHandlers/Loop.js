"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../../db"));
const xml_js_1 = __importDefault(require("xml-js"));
const dbRates_1 = __importDefault(require("../../dbRates"));
const ErrorHandler_1 = __importDefault(require("../ParserHandlers/ErrorHandler"));
const CitiesHandler_1 = __importDefault(require("../ParserHandlers/CitiesHandler"));
const RateFormatter_1 = __importDefault(require("../ParserHandlers/RateFormatter"));
class Loop {
    constructor(exchangerId, rates_link) {
        this.run = () => {
            const getRatesIn = db_1.default.getData(".timeouts.getRatesIn");
            setTimeout(() => {
                if (!db_1.default.exists(`.exchangers.${this.exchangerId}`)) {
                    console.log(`\u001b[1;34m ⓘ ${this.exchangerId} : Перестанет опрашиваться!`);
                    this._clearAllAssociatedRates();
                    return;
                }
                this._getRates();
                this.run();
            }, getRatesIn);
        };
        this._getRates = () => {
            const { exchangerId, rates_link } = this;
            const expireIn = db_1.default.getData(".timeouts.expireIn");
            axios_1.default
                .get(rates_link, { timeout: expireIn })
                .then(function (response) {
                var _a, _b, _c;
                const errorHandler = new ErrorHandler_1.default(exchangerId);
                const citiesHandler = new CitiesHandler_1.default();
                const rateFormatter = new RateFormatter_1.default(exchangerId);
                let JSONres = xmlToJson(errorHandler, response === null || response === void 0 ? void 0 : response.data);
                const wereRatesReceived = rateFormatter.checkForErrors(JSONres);
                if (wereRatesReceived && ((_a = JSONres.rates) === null || _a === void 0 ? void 0 : _a.item)) {
                    console.log(`\u001b[1;32m ✔ ${exchangerId} : Курсов получено : ${(_b = JSONres.rates) === null || _b === void 0 ? void 0 : _b.item.length}`);
                    let ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, (_c = JSONres.rates) === null || _c === void 0 ? void 0 : _c.item);
                    rateFormatter.formatAndMatchRatesWithDirs(ratesDataWithGroupedCities);
                    JSONres = {};
                    ratesDataWithGroupedCities = [];
                }
            })
                .catch(function (err) {
                const { message, code, status } = err;
                const numberCode = message.match(/\d+/) && message.match(/\d+/)[0];
                const errorHandler = new ErrorHandler_1.default(exchangerId);
                errorHandler.saveError(code || status || numberCode, message);
            });
        };
        this._clearAllAssociatedRates = () => {
            const allDirsRates = dbRates_1.default.getData(".allDirsRates");
            Object.entries(allDirsRates).map(([_, dirRates]) => delete dirRates[this.exchangerId]);
            dbRates_1.default.push(".dirRates", allDirsRates);
        };
        this.exchangerId = exchangerId;
        this.rates_link = rates_link;
    }
}
exports.default = Loop;
const xmlToJson = (errorHandler, data) => {
    const options = {
        compact: true,
        ignoreComment: true,
        alwaysChildren: true,
    };
    let res = {};
    try {
        res = JSON.parse(xml_js_1.default.xml2json(data, options));
    }
    catch ({ message }) {
        errorHandler.saveError("json-parsing-error", message || "...");
    }
    return res;
};
//# sourceMappingURL=Loop.js.map