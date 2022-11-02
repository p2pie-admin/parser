import { GraphQLClient } from "graphql-request";
import db from "../db";
import normalizer from "./normalizer";
import dotenv from "dotenv";

dotenv.config();
const jwt = db.getData(".jwt");
const headers = jwt
  ? {
      authorization: `Bearer ${jwt}`,
    }
  : ({} as {});

const strapiLink = process.env.ISDEV
  ? process.env.DEV_STRAPI!
  : process.env.STRAPI!;

if (!strapiLink) console.log("📙 \u001b[1;33m strapiLink is: ", strapiLink);

const callStrapi = async (query: any, variables?: any) => {
  const graphQLClient = new GraphQLClient(strapiLink || "", {
    headers,
  });
  try {
    const data = await graphQLClient.request(query, variables);
    const res = normalizer(data);
    return res;
  } catch (err) {
    console.error("📙 \u001b[1;33m -- GQL ERROR -- ", err);
    return null;
  }
};

export default callStrapi;
