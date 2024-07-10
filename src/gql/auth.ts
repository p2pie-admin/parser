import db from "../db";
import callStrapi from "./callStrapi";
import { AuthMutation } from "./queries";

async function auth() {
  await db.push(".jwt", undefined);
  console.log("Authorizing ...");
  const data = await callStrapi(AuthMutation);
  const jwt = data?.login?.jwt;
  if (jwt) {
    console.log("📗 \u001b[1;32m Authorized successfully!");
    await db.push(".jwt", jwt);
    return;
  }
  console.error("📙 \u001b[1;33m couldn't authtorize, restarting in 10s...");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await auth();
}

export default auth;
