import { GraphQLClient } from "graphql-request";
import { ExchangersQuery } from "../queries.js";

async function getExchangers(exchangerNames) {
  const variables = {
    names: exchangerNames,
  };
  try {
    const graphQLClient = new GraphQLClient(
      process.env.PORT ? process.env.STRAPI : process.env.LOCAL_STRAPI
    );
    const { exchangers } = await graphQLClient.request(
      ExchangersQuery,
      variables
    );
    return exchangers;
  } catch (err) {
    console.log(err);
  }
}

export default getExchangers;
