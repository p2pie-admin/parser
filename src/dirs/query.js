const gql = require("graphql-request").gql;

const popularDirsQuery = gql`
  {
    popularDirections {
      title
      both_ways
      pms {
        ... on ComponentSharedPm {
          pm {
            pm_group {
              short_name
              options {
                ... on ComponentSelectorCurrency {
                  currency {
                    name
                  }
                }
                ... on ComponentSelectorSubclass {
                  name
                  short_name
                  currency {
                    name
                  }
                }
              }
            }
            currency {
              name
            }
            subitem_short_name
          }
        }
      }
    }
  }
`;

module.exports = popularDirsQuery;
