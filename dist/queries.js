"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatesPreferencesQuery = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
const ExchangersQuery = (0, graphql_request_1.gql) `
  query Exchangers($names: [String!]) {
    exchangers(where: { name_contains: $names, status: ["active"] }) {
      name
      our_rating
      logo {
        url
        previewUrl
      }
      tag
      date_listed
      description
    }
  }
`;
exports.ExchangersQuery = ExchangersQuery;
const RatesPreferencesQuery = (0, graphql_request_1.gql) `
  {
    ratesFilterPreference {
      dirs_disabled
      update_time_sec
      dirs_cleaning_coefficient
      cities
      best_rating
      optimal
      lowest_min
      best_course
      fast
      top_reserve
      most_popular
    }
  }
`;
exports.RatesPreferencesQuery = RatesPreferencesQuery;
//# sourceMappingURL=queries.js.map