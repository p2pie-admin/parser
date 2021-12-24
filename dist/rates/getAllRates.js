"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_json_1 = require("../config.json");
const convertation_1 = __importDefault(require("./convertation"));
async function getAllRates(dir) {
    const { dirs, preferences } = db_1.default.getObject(".");
    const dirsToRequest = preferences.dirs_disabled
        ? Object.keys(dirs).filter((dir) => !preferences.dirs_disabled
            .split("\n")
            .find((d) => d.toUpperCase() === dir))
        : Object.keys(dirs);
    db_1.default.push(".lastDir", dir);
    try {
        const response = await (0, node_fetch_1.default)(config_json_1.RATES_PROVIDER + dirsToRequest);
        const allRateStrings = (await response.json());
        if (Object.keys(allRateStrings).length) {
            const allFilteredRates = (0, convertation_1.default)(allRateStrings);
            db_1.default.push(".all_rates", allFilteredRates);
            db_1.default.save();
            return allFilteredRates[dir];
        }
    }
    catch (err) {
        console.log(err);
    }
    return null;
}
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map