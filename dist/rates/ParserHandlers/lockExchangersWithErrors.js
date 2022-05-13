"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = __importDefault(require("../../config.json"));
const graphql_request_1 = require("graphql-request");
const graphql_request_2 = require("graphql-request");
const db_1 = __importDefault(require("../../db"));
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const mutation = (0, graphql_request_2.gql) `
    mutation UpdateExchangerStatus($exchangerId: ID!, $status: ENUM_EXCHANGER_STATUS) {
    updateExchanger(id: $exchangerId, data: {   status: $status}) {
          data {
            id
          }
      }
    }
`;
const codesToDisable = ["ECONNREFUSED", "EPERM", "404", "403", "unknown-error", "data-error", "json-parsing-error"];
async function lockExchangersWithErrors() {
    const errors = db_1.default.getData(".errors");
    const graphQLClient = new graphql_request_1.GraphQLClient(process.env.PORT ? config_json_1.default.STRAPI : config_json_1.default.LOCAL_STRAPI, {
        headers: {
            authorization: `Bearer ${config_json_1.default.EXCHANGER_TOKEN}`,
        },
    });
    Object.entries(errors).map(async ([exchangerId, error]) => {
        if (error.isStatusChanged)
            return;
        console.log(`...changing status for ${exchangerId}`);
        const status = codesToDisable.find(code => code === error.code) ? "disabled" : "suspended";
        try {
            await graphQLClient.request(mutation, { exchangerId, status });
            const errorHandler = new ErrorHandler_1.default(exchangerId);
            errorHandler.setErrorStatusChanged(true);
            return;
        }
        catch (err) {
            console.error("Exchanger locker failed: ", err.message);
            return;
        }
    });
}
exports.default = lockExchangersWithErrors;
//# sourceMappingURL=lockExchangersWithErrors.js.map