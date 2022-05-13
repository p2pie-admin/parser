"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const config_json_1 = __importDefault(require("../config.json"));
const graphql_request_2 = require("graphql-request");
const exchangerLinks_json_1 = __importDefault(require("./exchangerLinks.json"));
const mutation = (0, graphql_request_2.gql) `
mutation CreateExchanger($name:String, $rates_link:String, $status: ENUM_EXCHANGER_STATUS){
  createExchanger(data: {name: $name, rates_link: $rates_link, status: $status}){
    data{
      id  
    }
  }
}
`;
async function createExchangers() {
    const graphQLClient = new graphql_request_1.GraphQLClient(process.env.PORT ? config_json_1.default.STRAPI : config_json_1.default.LOCAL_STRAPI, {
        headers: {
            authorization: `Bearer ${config_json_1.default.EXCHANGER_TOKEN}`,
        },
    });
    Object.entries(exchangerLinks_json_1.default).map(async ([name, rates_link]) => {
        try {
            await graphQLClient.request(mutation, { name, rates_link, status: "active" });
        }
        catch (err) {
            console.error(err);
        }
    });
}
exports.default = createExchangers;
//# sourceMappingURL=createExchangers.js.map