// import initialDB from "./initialDB";
// import { DB } from "../types";

// import { JsonDB } from "node-json-db";
// import { Config } from "node-json-db/dist/lib/JsonDBConfig";

// const db = new JsonDB(new Config("db", false, true, ".")); // save after each push = false, readable = true
// async function initializeDb() {
//   if (!Object.keys(db.getObject<DB>(".")).length) {
//     db.resetData({});
//     await db.push(".", initialDB); // initialization
//     await db.save();
//   }
// }
// initializeDb();

// export default db;
