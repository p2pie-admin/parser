import { gql } from "graphql-request";

export const ExchangersQuery = gql`
  {
    exchangers(
      filters: { status: { in: ["active"] } }
      pagination: { start: 0, limit: 50 }
    ) {
      data {
        id
        attributes {
          name
          admin_rating
          tag
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

export const ParserSettingQuery = gql`
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

export const PmGroupsQuery = gql`
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

export const TopsQuery = gql`
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

export const updateExchangerStatus = gql`
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

export const getAllExchangerIds = gql`
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

export const PopularPmsQuery = gql`
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
