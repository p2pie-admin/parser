"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../../db"));
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const CitiesHandler_1 = __importDefault(require("./CitiesHandler"));
const RateFormatter_1 = __importDefault(require("./RateFormatter"));
const xml_js_1 = __importDefault(require("xml-js"));
const cleanRates_1 = require("../cleaners/cleanRates");
const convertXMLtoJSON = (errorHandler, data) => {
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
        errorHandler.saveError("json-parsing-error", message);
    }
    return res;
};
class Parser {
    constructor(exchangers) {
        this._getRate = (exchangerId, expireIn, rates_link) => {
            axios_1.default
                .get(rates_link)
                .then(function (response) {
                var _a, _b;
                const errorHandler = new ErrorHandler_1.default(exchangerId);
                const JSONres = convertXMLtoJSON(errorHandler, response === null || response === void 0 ? void 0 : response.data);
                const citiesHandler = new CitiesHandler_1.default();
                const rateFormatter = new RateFormatter_1.default(exchangerId);
                const wereRatesReceived = rateFormatter.checkForErrors(JSONres);
                if (wereRatesReceived && ((_a = JSONres.rates) === null || _a === void 0 ? void 0 : _a.item)) {
                    console.log(`\u001b[1;32m Rates received for: ${exchangerId}`);
                    const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, (_b = JSONres.rates) === null || _b === void 0 ? void 0 : _b.item);
                    rateFormatter.formatAndMatchRatesWithDirs(ratesDataWithGroupedCities);
                    db_1.default.push(`.exchangers.${exchangerId}.status`, "active");
                }
            })
                .catch(function (err) {
                const { message, code, status } = err;
                const numberCode = message.match(/\d+/) && message.match(/\d+/)[0];
                const errorHandler = new ErrorHandler_1.default(exchangerId);
                errorHandler.saveError(code || status || numberCode, message);
            });
        };
        this._stopOnDataChange = (intervalId, exchangerId, initialStatus) => {
            const { rates_link, status } = db_1.default.exists(`.exchangers.${exchangerId}`) ? db_1.default.getData(`.exchangers.${exchangerId}`) : { rates_link: "", status: "disabled" };
            if (initialStatus !== status) {
                console.log(`\u001b[1;34m ${exchangerId} changed status from ${initialStatus} to ${status}`);
                clearInterval(intervalId);
                (0, cleanRates_1.cleanRates)(exchangerId);
                status !== "disabled" && this._runExchangerLoop(exchangerId);
                return;
            }
        };
        this._runExchangerLoop = (exchangerId) => {
            const { rates_link, status } = db_1.default.exists(`.exchangers.${exchangerId}`) ? db_1.default.getData(`.exchangers.${exchangerId}`) : { rates_link: "", status: "disabled" };
            const timeout = db_1.default.getData(".parser_setting.timeout") || 30000;
            if (status === "disabled") {
                (0, cleanRates_1.cleanRates)(exchangerId);
                return;
            }
            const exchangerTimeout = status === "active" ? timeout : timeout * (Math.random() * 10 + 20);
            const intervalId = setInterval(() => {
                this._stopOnDataChange(intervalId, exchangerId, status);
                this._getRate(exchangerId, timeout - 2000, rates_link);
            }, exchangerTimeout);
        };
        this.exchangers = exchangers;
    }
    pollExchangerLinks(gap) {
        let leftToLoop = Object.keys(this.exchangers).length;
        Object.keys(this.exchangers).map(async (exchangerId, n) => {
            await new Promise(resolve => setTimeout(resolve, n * gap));
            console.log(`${exchangerId} requested, ${leftToLoop} left`);
            leftToLoop -= 1;
            this._runExchangerLoop(exchangerId);
        });
    }
}
exports.default = Parser;
//# sourceMappingURL=Parser.js.map