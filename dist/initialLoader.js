"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const queries_1 = require("./queries");
const config_json_1 = __importDefault(require("./config.json"));
const db_1 = __importDefault(require("./db"));
async function initialLoader() {
    try {
        const graphQLClient = new graphql_request_1.GraphQLClient(process.env.PORT ? config_json_1.default.STRAPI : config_json_1.default.LOCAL_STRAPI);
        const prefsData = await graphQLClient.request(queries_1.RatesPreferencesQuery);
        db_1.default.push(".preferences", prefsData.ratesFilterPreference);
        const exchangersData = await graphQLClient.request(queries_1.ExchangersQuery);
        db_1.default.push(".exchangers", exchangersData.exchangers);
        db_1.default.save();
    }
    catch (err) {
        console.log(err);
    }
}
exports.default = initialLoader;
//# sourceMappingURL=initialLoader.js.map