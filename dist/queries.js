"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PmGroupsQuery = exports.ParserSettingQuery = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
const ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(filters: {status: {in: ["active", "suspended"]}} pagination: { start: 1, limit: 1000 }){
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
const ParserSettingQuery = (0, graphql_request_1.gql) `
{
    parserSetting{
      data{
        attributes{
          restart_after_sec
          filter_options
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
exports.ParserSettingQuery = ParserSettingQuery;
const PmGroupsQuery = (0, graphql_request_1.gql) `
{
  selector {
    data {
      attributes {
        sections {
          pm_groups(pagination: { start: 0, limit: 1000 }) {
            data {
              attributes {
                prefix
                options {
                  ... on ComponentSelectorSubgroup {
                		code
                  }
                  ... on ComponentSelectorCurrency {
                    currency {
                      data {
                        attributes {
                          code
                        }
                      }
                    }   
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
exports.PmGroupsQuery = PmGroupsQuery;
//# sourceMappingURL=queries.js.map