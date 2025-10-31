import { GraphQLClient } from "graphql-request";

import normalizer from "./normalizer";
import dotenv from "dotenv";
import { mylog } from "../utils/logger";
import { getData } from "../utils/redis";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const strapiLink =
  env === "production" ? process.env.STRAPI! : process.env.DEV_STRAPI!;
if (!strapiLink) mylog(`strapiLink is:  ${strapiLink}`, "info");

const callStrapi = async (query: any, variables?: any) => {
  const jwt = await getData("parser_jwt");
  const headers = jwt
    ? {
        authorization: `Bearer ${jwt}`,
      }
    : ({} as {});

  const graphQLClient = new GraphQLClient(strapiLink || "", {
    headers,
  });
  try {
    const data = await graphQLClient.request(query, variables);
    const res = normalizer(data);
    return res;
  } catch (err) {
    mylog("-- GQL ERROR --", "error");
    mylog(`${err}`, "error");
    jwt && jwt.length > 5 && mylog("JWT exists", "warning");
    jwt && jwt.length > 5 && mylog(err as string, "error");
  }
};

export default callStrapi;
