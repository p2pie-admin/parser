"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularPmsQuery = exports.getAllExchangerIds = exports.updateExchangerStatus = exports.CreateExchangersMutation = exports.AuthMutation = exports.TopsQuery = exports.PmGroupsQuery = exports.ParserSettingQuery = exports.ExchangersQuery = void 0;
const graphql_request_1 = require("graphql-request");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const toLoop = Number(process.env.EXCHANGERS_TO_LOOP || 10000);
exports.ExchangersQuery = (0, graphql_request_1.gql) `
  {
    exchangers(
      filters: {  ref_link: {notNull: true}  rates_link: {notNull: true} status: { in: ["active", "suspended"] } }
      pagination: { start: 0, limit: ${toLoop} }
    ) {
      data {
        id
        attributes {
          name
          admin_rating
          tag
          status
          rates_link
          ref_link
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
            en_title
            ru_title
            pm_groups(pagination: { start: 0, limit: 1000 }) {
              data {
                attributes {
                  en_name
                  ru_name
                  prefix
                  options {
                    ... on ComponentSelectorSubgroup {
                      code
                      name
                      alternative_codes
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
        identifier: "parser"
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
exports.PopularPmsQuery = (0, graphql_request_1.gql) `
  {
    pms(filters: { popular_as: { ne: "none" } }) {
      data {
        id
        attributes {
          code
          popular_as
          pm_group {
            data {
              id
              attributes {
                en_name
                ru_name
                prefix
                options {
                  ... on ComponentSelectorSubgroup {
                    id
                    name
                    code
                    currency {
                      data {
                        id
                        attributes {
                          code
                          accuracy
                        }
                      }
                    }
                  }
                  ... on ComponentSelectorCurrency {
                    id
                    currency {
                      data {
                        id
                        attributes {
                          code
                          accuracy
                        }
                      }
                    }
                  }
                }
                color

                icon {
                  data {
                    id
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
    }
  }
`;
