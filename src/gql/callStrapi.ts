import { ClientError, GraphQLClient } from "graphql-request";

import normalizer from "./normalizer";
import dotenv from "dotenv";
import { mylog } from "../utils/logger";
import { getData, setData } from "../utils/redis";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const strapiLink =
  env === "production" ? process.env.STRAPI! : process.env.DEV_STRAPI!;
if (!strapiLink) mylog(`strapiLink is:  ${strapiLink}`, "info");

const isForbiddenError = (err: unknown, hasJwt: boolean) => {
  if (!hasJwt) return false;
  if (err instanceof ClientError) {
    return err.response?.errors?.some(
      ({ message }) => message === "Forbidden access"
    );
  }
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as any).response;
    if (response?.errors?.length) {
      return response.errors.some(
        ({ message }: { message?: string }) => message === "Forbidden access"
      );
    }
  }
  if (typeof err === "string") {
    return err.includes("Forbidden access");
  }
  return false;
};

const callStrapi = async (
  query: any,
  variables?: any,
  allowRetry = true
): Promise<any> => {
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
    const status = (err as any)?.response?.status;
    const rawResponseError =
      (err as any)?.response?.error ||
      (err as any)?.response?.errors?.[0]?.message ||
      (err as any)?.message;
    const snippet =
      typeof rawResponseError === "string"
        ? rawResponseError.replace(/\s+/g, " ").trim().slice(0, 140)
        : "GraphQL error";
    mylog(`-- GQL ERROR -- ${status ? `status ${status} | ` : ""}${snippet}`, "error");
    const hasJwt = Boolean(jwt && jwt.length > 5);
    if (isForbiddenError(err, hasJwt) && allowRetry) {
      mylog("JWT rejected, re-authorizing...", "warning");
      await setData("parser_jwt", "", 5);
      const { default: auth } = await import("./auth");
      await auth();
      return callStrapi(query, variables, false);
    }

    hasJwt && mylog("JWT exists", "warning");
  }
};

export default callStrapi;
