import { mylog } from "../utils/logger";
import { setData } from "../utils/redis";
import callStrapi from "./callStrapi";
import { AuthMutation } from "./queries";

async function auth() {
  mylog("Authorizing ...");
  await setData("parser_jwt", "", 0);
  // Credentials come from the environment (rotated in /root/.env), never from source.
  const data = await callStrapi(AuthMutation, {
    identifier: process.env.STRAPI_AUTH_IDENTIFIER || "parser",
    password: process.env.STRAPI_AUTH_PASSWORD || "",
  });
  const jwt = data?.login?.jwt;
  if (jwt) {
    mylog("Authorized successfully!", "success");
    // persist token without TTL; Strapi will revoke it when necessary
    await setData("parser_jwt", jwt, 0);
    return;
  }
  mylog("Couldn't authtorize, restarting in 30s...", "warning");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await auth();
}

export default auth;
