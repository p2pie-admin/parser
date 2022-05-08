"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const initialDB_1 = __importDefault(require("./initialDB"));
const node_json_db_1 = require("node-json-db");
const JsonDBConfig_1 = require("node-json-db/dist/lib/JsonDBConfig");
const db = new node_json_db_1.JsonDB(new JsonDBConfig_1.Config("db", false, true, "."));
if (!Object.keys(db.getObject(".")).length) {
    db.resetData({});
    db.push(".", initialDB_1.default);
    db.save();
}
exports.default = db;
//# sourceMappingURL=index.js.map