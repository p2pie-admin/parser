"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatesPreferencesQuery = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
const ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(where: { status: ["active"] }) {
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
      update_time_sec
      dirs_disabled
      optimal_course_power
      dirs_cleaning_coefficient
      SD_applied_from
      SD_best_rates
      SD_worst_rates
      filter_options {
        name
      }
      cities
    }
  }
`;
exports.RatesPreferencesQuery = RatesPreferencesQuery;
//# sourceMappingURL=queries.js.map