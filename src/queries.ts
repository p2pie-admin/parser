import { gql } from "graphql-request";

const ExchangersQuery = gql`
  {
    exchangers(filters: { status: {in: ["active"]}} pagination: { start: 0, limit: 222 }){
      data{
        id
        attributes{
          name
          status
          rates_link
        }
      }
    }
  }
`;

const ParserSettingQuery = gql`
{
    parserSetting{
      data{
        attributes{
          timeout
          filter_options
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
`

export { ExchangersQuery, ParserSettingQuery, PmGroupsQuery };
