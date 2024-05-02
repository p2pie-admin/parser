import db from "./db";
import { AuthMutation } from "./gql/queries";
import callStrapi from "./gql/callStrapi";
import initialLoader from "./initialLoader";
import statusChange from "./statusChange";
import startMainFlow from "./startMainFlow";
import dotenv from "dotenv";
import auth from "./gql/auth";

const startParser = async () => {
  dotenv.config();
  await auth();
  // createExchangers() call to initilize exchangers from links JSON
  await statusChange("suspended", "active");
  await statusChange("disabled", "active");
  await initialLoader();
  Number(process.env.EXCHANGERS_TO_LOOP) && startMainFlow();
};

export default startParser;
