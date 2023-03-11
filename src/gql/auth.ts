import db from "../db";
import { AuthMutation } from "./queries";
import callStrapi from "./callStrapi";

const auth = async () => {
  const data = await callStrapi(AuthMutation);
  const jwt = data?.login?.jwt;

  if (jwt) {
    console.log("📗 \u001b[1;32m Authorized successfully!");
    db.push(".jwt", jwt);
    db.save();
    return;
  }
  console.error("📙 \u001b[1;33m couldn't authtorize!");
};

export default auth;
