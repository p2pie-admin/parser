// import initialDB from "./initialDB";
// import { DBRATES } from "../types";

// import { JsonDB } from "node-json-db";
// import { Config } from "node-json-db/dist/lib/JsonDBConfig";

// const dbRates = new JsonDB(new Config("dbRates", false, true, "."));
// async function initializedbRates() {
//   if (!Object.keys(dbRates.getObject<DBRATES>(".")).length) {
//     dbRates.resetData({});
//     await dbRates.push(".", initialDB); // initialization
//     await dbRates.save();
//   }
// }
// initializedbRates();

// export default dbRates;
