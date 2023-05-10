"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExchangerIds = exports.updateExchangerStatus = exports.CreateExchangersMutation = exports.AuthMutation = exports.TopsQuery = exports.PmGroupsQuery = exports.ParserSettingQuery = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
exports.ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(
      filters: { status: { in: ["active"] } }
      pagination: { start: 0, limit: 20000 }
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
exports.ParserSettingQuery = (0, graphql_request_1.gql) `
  {
    parserSetting {
      data {
        attributes {
          dirs_disabled
          cities
          SD_applied_from
          SD_best
          SD_worst
          pause_between_loops
        }
      }
    }
  }
`;
exports.PmGroupsQuery = (0, graphql_request_1.gql) `
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
exports.TopsQuery = (0, graphql_request_1.gql) `
  {
    topParameters {
      data {
        id
        attributes {
          code
          parameter {
            id
            en_description
            ru_description
            color
            icon {
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
  }
`;
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
exports.updateExchangerStatus = (0, graphql_request_1.gql) `
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
exports.getAllExchangerIds = (0, graphql_request_1.gql) `
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
//# sourceMappingURL=queries.js.map