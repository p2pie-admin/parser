"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbRates_1 = __importDefault(require("../dbRates"));
const Tops_1 = require("../rates/Tops");
exports.default = () => {
    const testDirRates = dbRates_1.default.getData(".allDirsRates.BTC_TCSBRUB");
    console.log("total length: ", Object.keys(testDirRates).length);
    const res = (0, Tops_1.getDirTop)(testDirRates, "BTC_TCSBRUB");
    console.log("best length: ", res.length);
    res.map((rate) => console.log(`min:${rate.min.give} max:${rate.max.give} course:${(1 /
        rate.course /
        10000).toFixed(0)}`));
};
