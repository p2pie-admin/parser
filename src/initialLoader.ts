import { GraphQLClient } from "graphql-request";
import { RatesPreferencesQuery, ExchangersQuery } from "./queries";
import config from "./config.json";
import db from "./db";

async function initialLoader() {
  try {
    const graphQLClient = new GraphQLClient(
      process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI
    );
    const prefsData = await graphQLClient.request(RatesPreferencesQuery);
    db.push(".preferences", prefsData.ratesFilterPreference);
    const exchangersData = await graphQLClient.request(ExchangersQuery);
    db.push(".exchangers", exchangersData.exchangers);
    db.save();
  } catch (err) {
    console.log(err);
  }
}

export default initialLoader;
