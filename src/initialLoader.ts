import { GraphQLClient } from "graphql-request";
import { ParserSetting, ExchangersQuery } from "./queries";
import config from "./config.json";
import db from "./db";
import normalizer  from "./normalizer"


async function initialLoader() {
  try {
    const graphQLClient = new GraphQLClient(
      process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI
    );
    const data = await graphQLClient.request(ParserSetting);
    db.push(".parser_setting", normalizer(data.parserSetting));
    const exchangersData = await graphQLClient.request(ExchangersQuery);
    db.push(".exchangers", normalizer(exchangersData.exchangers));
    db.save();
    console.log("parser settings and exchangers were updated!");
  } catch (err) {
    console.log(err);
  }
}

export default initialLoader;
