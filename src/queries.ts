import { gql } from "graphql-request";

const ExchangersQuery = gql`
  query Exchangers($names: [String!]) {
    exchangers(where: { name_contains: $names, status: ["active"] }) {
      name
      our_rating
      logo {
        url
        previewUrl
      }
      tag
      date_listed
      description
    }
  }
`;

const RatesPreferencesQuery = gql`
  {
    ratesFilterPreference {
      dirs_disabled
      update_time_sec
      dirs_cleaning_coefficient
      cities
      best_rating
      optimal
      lowest_min
      best_course
      fast
      top_reserve
      most_popular
    }
  }
`;

export { ExchangersQuery, RatesPreferencesQuery };
