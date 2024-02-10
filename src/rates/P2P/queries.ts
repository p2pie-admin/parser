import { gql } from "graphql-request";

export const ordersQuery = gql`
  {
    p2Ps(filters: { status: { eq: "active" } }) {
      data {
        id
        attributes {
          name
          status
          dirs
          regulationCodes
          locations
          uid
        }
      }
    }
  }
`;
