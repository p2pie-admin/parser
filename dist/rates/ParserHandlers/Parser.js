"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../../db"));
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const FinishParsing_1 = __importDefault(require("./FinishParsing"));
const CitiesHandler_1 = __importDefault(require("./CitiesHandler"));
const XMLConverter_1 = __importDefault(require("./XMLConverter"));
const xml_js_1 = __importDefault(require("xml-js"));
const afterExchangerParsing = () => {
    const leftToParse = db_1.default.getData(".left_to_parse");
    db_1.default.push(".left_to_parse", leftToParse - 1);
    console.log(leftToParse, " left");
    if (leftToParse <= 0) {
        (0, FinishParsing_1.default)();
    }
};
class Parser {
    constructor(ratesLinks) {
        this.ratesLinks = ratesLinks;
    }
    async _requestXML(ratesLink, exchangerId) {
        return axios_1.default
            .get(ratesLink, { timeout: 1000 * 150 })
            .then(function (response) {
            var _a, _b;
            afterExchangerParsing();
            const options = {
                compact: true,
                ignoreComment: true,
                alwaysChildren: true,
            };
            const errorHandler = new ErrorHandler_1.default(exchangerId);
            let res = {};
            try {
                res = JSON.parse(xml_js_1.default.xml2json(response.data, options));
            }
            catch ({ message }) {
                errorHandler.saveError("json-parsing-error", message);
            }
            const citiesHandler = new CitiesHandler_1.default();
            const xmlConverter = new XMLConverter_1.default(exchangerId);
            const wereRatesReceived = xmlConverter.checkForErrors(res);
            if (wereRatesReceived && ((_a = res.rates) === null || _a === void 0 ? void 0 : _a.item)) {
                console.log(`Succeeded: ${exchangerId}`);
                errorHandler.deleteError();
                const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, (_b = res.rates) === null || _b === void 0 ? void 0 : _b.item);
                xmlConverter.matchXMLRatesWithDirs(ratesDataWithGroupedCities);
            }
        })
            .catch(function (err) {
            afterExchangerParsing();
            const { message, code, status } = err;
            const numberCode = message.match(/\d+/) && message.match(/\d+/)[0];
            const errorHandler = new ErrorHandler_1.default(exchangerId);
            errorHandler.saveError(code || status || numberCode, message);
        });
    }
    requestAllXMLs() {
        db_1.default.push(".left_to_parse", this.ratesLinks.length - 1);
        try {
            this.ratesLinks.map(async ({ exchangerId, ratesLink }) => await this._requestXML(ratesLink, exchangerId));
        }
        catch (err) {
            console.log('Fail');
        }
    }
}
exports.default = Parser;
//# sourceMappingURL=Parser.js.map