"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopsQuery = exports.PmGroupsQuery = exports.ParserSettingQuery = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
const ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(
      filters: { status: { in: ["active"] } }
      pagination: { start: 0, limit: 1000 }
    ) {
      data {
        id
        attributes {
          name
          admin_rating
          tag
          rates_link
          logo {  
            data {
              attributes {
                alternativeText
                url
              }
            }
          }
        }
      }
    }
  }
`;
exports.ExchangersQuery = ExchangersQuery;
const ParserSettingQuery = (0, graphql_request_1.gql) `
  {
    parserSetting {
      data {
        attributes {
          dirs_disabled
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
const TopsQuery = (0, graphql_request_1.gql) `
  {
    tops {
      data {
        id
        attributes {
          code
        }
      }
    }
  }
`;
exports.TopsQuery = TopsQuery;
//# sourceMappingURL=queries.js.map