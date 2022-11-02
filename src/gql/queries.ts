import { gql } from "graphql-request";

const ExchangersQuery = gql`
  {
    exchangers(
      filters: { status: { in: ["active"] } }
      pagination: { start: 0, limit: 10 }
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

const ParserSettingQuery = gql`
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

const PmGroupsQuery = gql`
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

const TopsQuery = gql`
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

export const AuthMutation = gql`
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

export const CreateExchangersMutation = gql`
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

export const LockExchangerMutation = gql`
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

export { ExchangersQuery, ParserSettingQuery, PmGroupsQuery, TopsQuery };
