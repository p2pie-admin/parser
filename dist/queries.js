"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserSetting = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
const ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(filters: {status: {eq: "disabled"}} pagination: { start: 1, limit: 1000 }){
      data{
        id
        attributes{
          name
          description
          logo{
            data{
              attributes{
                name
                url
                alternativeText
              }
            }
          }
          status
          tag
          date_listed
          ref_link
          rates_link

        }
      }
    }
  }
`;
exports.ExchangersQuery = ExchangersQuery;
const ParserSetting = (0, graphql_request_1.gql) `
{
    parserSetting{
      data{
        attributes{
          update_time_sec
          dirs_disabled
          course_power
          cities
          SD_applied_from
          SD_best
          SD_worst

        }
      }
    }
}
`;
exports.ParserSetting = ParserSetting;
//# sourceMappingURL=queries.js.map