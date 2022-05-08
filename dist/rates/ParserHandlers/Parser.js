"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dbRates_1 = __importDefault(require("../../dbRates"));
const ErrorCreator_1 = __importDefault(require("./ErrorCreator"));
const piscina_1 = __importDefault(require("piscina"));
const path_1 = require("path");
const pool = new piscina_1.default({
    filename: (0, path_1.resolve)('./dist/worker.js'),
    maxQueue: 'auto'
});
class Parser {
    constructor(ratesLinks) {
        this.ratesLinks = ratesLinks;
    }
    async _requestXML(ratesLink, exchangerId) {
        return axios_1.default
            .get(ratesLink)
            .then(function (response) {
            const leftToParse = dbRates_1.default.getData(".left_to_parse");
            dbRates_1.default.push(".left_to_parse", leftToParse - 1);
            console.log('leftToParse', leftToParse);
            pool.run({ xml: response.data, exchangerId });
        })
            .catch(function (error) {
            const leftToParse = dbRates_1.default.getData(".left_to_parse");
            dbRates_1.default.push(".left_to_parse", leftToParse - 1);
            const errorCreator = new ErrorCreator_1.default(exchangerId);
            errorCreator.saveError("404", error.message);
        });
    }
    requestAllXMLs() {
        dbRates_1.default.push(".left_to_parse", this.ratesLinks.length - 1);
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