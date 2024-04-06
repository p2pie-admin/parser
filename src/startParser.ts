import db from "./db";
import { AuthMutation } from "./gql/queries";
import callStrapi from "./gql/callStrapi";
import initialLoader from "./initialLoader";
import statusChange from "./statusChange";
import startMainFlow from "./startMainFlow";
import dotenv from "dotenv";

const startParser = async () => {
  dotenv.config();
  db.push(".jwt", undefined); //чистим старый токен
  const data = await callStrapi(AuthMutation);
  if (!data) {
    console.log(
      "📙 \u001b[1;33m  Still waiting for connection, retrying in 5s..."
    );
    setTimeout(() => startParser(), 5000);
    return;
  }
  const jwt = data?.login?.jwt;
  if (jwt) {
    console.log("📗 \u001b[1;32m Authorized successfully!");
    db.push(".jwt", jwt);
    db.save();
    // createExchangers() call to initilize exchangers from links JSON
    await statusChange("suspended", "active");
    await statusChange("disabled", "active");
    await initialLoader();

    Number(process.env.EXCHANGERS_TO_LOOP) && startMainFlow();

    return;
  }
  console.error("📙 \u001b[1;33m couldn't authtorize");
  return;
};

export default startParser;
