"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const Parser_1 = __importDefault(require("./ParserHandlers/Parser"));
const getAllRates = () => {
    console.log("-= Rates Requested =-");
    const timesRatesRequested = db_1.default.getData(".times_rates_requested");
    const statusToRequest = timesRatesRequested % 37 === 0 ? 'suspended' : 'active';
    const exchangers = db_1.default.getData(`.exchangers.${statusToRequest}`);
    const exchangerDataForParser = exchangers.map(({ rates_link, id }) => ({ ratesLink: rates_link, exchangerId: id }));
    const parser = new Parser_1.default(exchangerDataForParser);
    parser.requestAllXMLs();
    db_1.default.push(".times_rates_requested", timesRatesRequested + 1);
};
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map