import { mylog } from "../helper";
import { setData } from "../redis";
import callStrapi from "./callStrapi";
import { AuthMutation } from "./queries";

async function auth() {
  mylog("Authorizing ...");
  await setData("parser_jwt", "");
  const data = await callStrapi(AuthMutation);
  const jwt = data?.login?.jwt;
  if (jwt) {
    mylog("Authorized successfully!", "success");
    await setData("parser_jwt", jwt);
    return;
  }
  mylog("Couldn't authtorize, restarting in 30s...", "warning");
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await auth();
}

export default auth;
