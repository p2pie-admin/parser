"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CitiesHandler_1 = __importDefault(require("./rates/ParserHandlers/CitiesHandler"));
const xml_js_1 = __importDefault(require("xml-js"));
const XMLConverter_1 = __importDefault(require("./rates/ParserHandlers/XMLConverter"));
exports.default = async ({ xml, exchangerId }) => {
    var _a, _b;
    const options = {
        compact: true,
        ignoreComment: true,
        alwaysChildren: true,
    };
    const res = JSON.parse(xml_js_1.default.xml2json(xml, options));
    const citiesHandler = new CitiesHandler_1.default();
    const xmlConverter = new XMLConverter_1.default(exchangerId);
    const wereRatesReceived = xmlConverter.checkForErrors(res);
    if (wereRatesReceived && ((_a = res.rates) === null || _a === void 0 ? void 0 : _a.item)) {
        console.log(`Succeded ${exchangerId}`);
        const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities((_b = res.rates) === null || _b === void 0 ? void 0 : _b.item);
        xmlConverter.matchXMLRatesWithDirs(ratesDataWithGroupedCities);
    }
};
//# sourceMappingURL=worker.js.map