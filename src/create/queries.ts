import { gql } from "graphql-request";

export const CreateExchangerMutation = gql`
  mutation CreateExchanger(
    $name: String
    $rates_link: String
    $ref_link: String
    $status: ENUM_EXCHANGER_STATUS
    $admin_comment: String
  ) {
    createExchanger(
      data: {
        name: $name
        rates_link: $rates_link
        ref_link: $ref_link
        status: $status
        admin_comment: $admin_comment
      }
    ) {
      data {
        id
      }
    }
  }
`;

export const getAllExchangersRatesLinksQuery = gql`
  {
    exchangers(pagination: { limit: 1000 }) {
      data {
        id
        attributes {
          rates_link
        }
      }
    }
  }
`;

export const getImmutableExchangersRatesLinksQuery = gql`
  {
    exchangers(
      pagination: { limit: 1000 }
      filters: { description: { notNull: true } }
    ) {
      data {
        id
        attributes {
          rates_link
        }
      }
    }
  }
`;
