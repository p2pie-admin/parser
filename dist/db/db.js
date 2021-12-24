"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simple_json_db_1 = __importDefault(require("simple-json-db"));
const db = new simple_json_db_1.default(__dirname + "/db.json");
exports.default = db;
//# sourceMappingURL=db.js.map