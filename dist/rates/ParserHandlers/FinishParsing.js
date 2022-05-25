"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
const Tops_1 = __importDefault(require("../Tops"));
exports.default = () => {
    console.log("saving rates...");
    const dirTops = (0, Tops_1.default)(dbRates_1.default.getData(".dirRates"));
    dbRates_1.default.push(".dirTops", dirTops);
    dbRates_1.default.save();
    db_1.default.save();
};
//# sourceMappingURL=FinishParsing.js.map