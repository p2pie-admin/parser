"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = __importDefault(require("../config.json"));
const graphql_request_1 = require("graphql-request");
const graphql_request_2 = require("graphql-request");
const normalizer_1 = __importDefault(require("../normalizer"));
const updateExchanger = (0, graphql_request_2.gql) `
    mutation UpdateExchangerStatus($exchangerId: ID!, $status: ENUM_EXCHANGER_STATUS) {
    updateExchanger(id: $exchangerId, data: {   status: $status}) {
          data {
            id
          }
      }
    }
`;
const getAllExchangerIds = (0, graphql_request_2.gql) `
    query getAllExchangerIds($status: String){
    exchangers(filters: {status: {eq: $status}} pagination: { start: 1, limit: 1000 }) {
        data{
        id
        }
    }
    }
`;
async function statusChange(fromStatus, toStatus, exchangerId) {
    const graphQLClient = new graphql_request_1.GraphQLClient(process.env.PORT ? config_json_1.default.STRAPI : config_json_1.default.LOCAL_STRAPI, {
        headers: {
            authorization: `Bearer ${config_json_1.default.EXCHANGER_TOKEN}`,
        },
    });
    let exchangerIds = [];
    if (exchangerId) {
        exchangerIds = [exchangerId];
        console.log(`\u001b[1;34m ${exchangerId} wants to be active again`);
    }
    else {
        const data = await graphQLClient.request(getAllExchangerIds, { status: fromStatus });
        exchangerIds = (0, normalizer_1.default)(data).exchangers.map(({ id }) => id);
        console.log(exchangerIds);
    }
    exchangerIds.map(async (exchangerId) => await graphQLClient.request(updateExchanger, { exchangerId, status: toStatus }));
}
exports.default = statusChange;
//# sourceMappingURL=statusChange.js.map