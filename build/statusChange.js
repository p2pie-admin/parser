"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const callStrapi_1 = __importDefault(require("./gql/callStrapi"));
const updateExchanger = (0, graphql_request_1.gql) `
  mutation UpdateExchangerStatus(
    $exchangerId: ID!
    $status: ENUM_EXCHANGER_STATUS
  ) {
    updateExchanger(id: $exchangerId, data: { status: $status }) {
      data {
        id
      }
    }
  }
`;
const getAllExchangerIds = (0, graphql_request_1.gql) `
  query getAllExchangerIds($status: String) {
    exchangers(
      filters: { status: { eq: $status } }
      pagination: { start: 1, limit: 1000 }
    ) {
      data {
        id
      }
    }
  }
`;
async function statusChange(fromStatus, toStatus, exchangerId) {
    let exchangerIds = [];
    if (exchangerId) {
        exchangerIds = [exchangerId];
        console.log(`📘 \u001b[1;34m ${exchangerId} wants to be active again`);
    }
    else {
        const data = await (0, callStrapi_1.default)(getAllExchangerIds, {
            status: fromStatus,
        });
        exchangerIds = data.exchangers.map(({ id }) => id);
        exchangerIds.length &&
            console.log(`📘 \u001b[1;34m Changed statuses from ${fromStatus} to ${toStatus} for exhangers: ${exchangerIds}`);
    }
    exchangerIds.map(async (exchangerId) => await (0, callStrapi_1.default)(updateExchanger, {
        exchangerId,
        status: toStatus,
    }));
}
exports.default = statusChange;
//# sourceMappingURL=statusChange.js.map