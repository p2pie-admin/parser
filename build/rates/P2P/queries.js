"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersQuery = void 0;
const graphql_request_1 = require("graphql-request");
exports.ordersQuery = (0, graphql_request_1.gql) `
  {
    p2Ps(filters: { status: { eq: "active" } }) {
      data {
        id
        attributes {
          name
          status
          dirs
          regulationCodes
          locations
          uid
        }
      }
    }
  }
`;
