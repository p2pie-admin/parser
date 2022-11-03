"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopsQuery = exports.PmGroupsQuery = exports.ParserSettingQuery = exports.ExchangersQuery = exports.LockExchangerMutation = exports.CreateExchangersMutation = exports.AuthMutation = void 0;
const graphql_request_1 = require("graphql-request");
const ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(
      filters: { status: { in: ["active"] } }
      pagination: { start: 0, limit: 100 }
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
exports.AuthMutation = (0, graphql_request_1.gql) `
  mutation login {
    login(
      input: {
        identifier: "course_filter"
        password: "x#@TH4L-#UJ#vq2"
        provider: "local"
      }
    ) {
      jwt
      user {
        username
        email
      }
    }
  }
`;
exports.CreateExchangersMutation = (0, graphql_request_1.gql) `
  mutation CreateExchanger(
    $name: String
    $rates_link: String
    $status: ENUM_EXCHANGER_STATUS
  ) {
    createExchanger(
      data: { name: $name, rates_link: $rates_link, status: $status }
    ) {
      data {
        id
      }
    }
  }
`;
exports.LockExchangerMutation = (0, graphql_request_1.gql) `
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
//# sourceMappingURL=queries.js.map