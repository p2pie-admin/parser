import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { DBRATES } from "src/types";
import initialDB from "./initialDB";

const dbRates = new JsonDB(new Config("dbRates", false, true, ".")); // save after each push = false, readable = true
if (!Object.keys(dbRates.getObject<DBRATES>(".")).length) {
  dbRates.push(".", initialDB); // initialization
  dbRates.save();
}

export default dbRates;
