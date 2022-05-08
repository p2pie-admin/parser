"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const Parser_1 = __importDefault(require("./ParserHandlers/Parser"));
const getAllRates = () => {
    console.log("rates requested");
    const exchangers = db_1.default.getData(".exchangers");
    const exchangerDataForParser = exchangers.map(({ rates_link, id }) => ({ ratesLink: rates_link, exchangerId: id }));
    const parser = new Parser_1.default(exchangerDataForParser);
    parser.requestAllXMLs();
};
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map