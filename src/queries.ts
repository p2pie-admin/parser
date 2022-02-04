import { gql } from "graphql-request";

const ExchangersQuery = gql`
  {
    exchangers(where: { status: ["active"] }) {
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
      update_time_sec
      dirs_disabled
      optimal_course_power
      dirs_cleaning_coefficient
      SD_applied_from
      SD_best_rates
      SD_worst_rates
      filter_options {
        name
      }
      cities
    }
  }
`;

export { ExchangersQuery, RatesPreferencesQuery };
