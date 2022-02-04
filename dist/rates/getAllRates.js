"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_json_1 = require("../config.json");
const conversion_1 = __importDefault(require("./conversion"));
async function getAllRates() {
    const dirs = db_1.default.getData(".dirs");
    const preferences = db_1.default.getData(".preferences");
    const dirsToRequest = preferences.dirs_disabled
        ? Object.keys(dirs).filter((dir) => !preferences.dirs_disabled
            .split("\n")
            .find((d) => d.toUpperCase() === dir))
        : Object.keys(dirs);
    try {
        const response = await (0, node_fetch_1.default)(config_json_1.RATES_PROVIDER + dirsToRequest);
        const allRateStrings = (await response.json());
        if (Object.keys(allRateStrings).length) {
            const allConvertedRates = (0, conversion_1.default)(allRateStrings);
            db_1.default.push(".allConvertedRates", allConvertedRates);
            db_1.default.save();
            console.log(`rates for ${Object.keys(dirs)} requested`);
            return allConvertedRates;
        }
    }
    catch (err) {
        console.log(err);
    }
    console.log("no rates requested");
    return null;
}
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map