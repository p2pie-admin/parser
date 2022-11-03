"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_json_db_1 = require("node-json-db");
const JsonDBConfig_1 = require("node-json-db/dist/lib/JsonDBConfig");
const initialDB_1 = __importDefault(require("./initialDB"));
const dbRates = new node_json_db_1.JsonDB(new JsonDBConfig_1.Config("dbRates", false, true, ".")); // save after each push = false, readable = true
if (!Object.keys(dbRates.getObject(".")).length) {
    dbRates.push(".", initialDB_1.default); // initialization
    dbRates.save();
}
exports.default = dbRates;
