"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callStrapi_1 = __importDefault(require("./callStrapi"));
const queries_1 = require("./queries");
const exchangerLinks_json_1 = __importDefault(require("../dbRates/exchangerLinks.json"));
async function createExchangers() {
    Object.entries(exchangerLinks_json_1.default).map(async ([name, rates_link]) => {
        await (0, callStrapi_1.default)(queries_1.CreateExchangersMutation, {
            name,
            rates_link,
            status: "active",
        });
    });
}
exports.default = createExchangers;
//# sourceMappingURL=createExchangers.js.map