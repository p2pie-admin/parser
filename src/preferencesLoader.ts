import { GraphQLClient } from "graphql-request";
import { RatesPreferencesQuery } from "./queries";
import config from "./config.json";
import db from "./db";

async function preferencesLoader() {
  try {
    const graphQLClient = new GraphQLClient(
      process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI
    );
    const data = await graphQLClient.request(RatesPreferencesQuery);
    db.push(".preferences", data.ratesFilterPreference);
    db.save();
  } catch (err) {
    console.log(err);
  }
}

export default preferencesLoader;
