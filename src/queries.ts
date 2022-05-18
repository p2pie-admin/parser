import { gql } from "graphql-request";

const ExchangersQuery = gql`
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

const ParserSettingQuery = gql`
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
