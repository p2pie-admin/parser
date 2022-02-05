"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const getAllRates_1 = __importDefault(require("../rates/getAllRates"));
const helper_1 = require("./helper");
async function handleDirRequest(dirId) {
    var _a;
    const { dirs, snapshot, counter, preferences } = db_1.default.getObject(".");
    db_1.default.push(`.dirs.${dirId}`, 1 + ((_a = dirs[dirId]) !== null && _a !== void 0 ? _a : 0));
    if (counter >
        Object.keys(dirs).length * (preferences.dirs_cleaning_coefficient || 10)) {
        db_1.default.push(".counter", 0);
        const newSnapshot = (0, helper_1.removeSame)(snapshot, dirs);
        db_1.default.push(".dirs", Object.assign({}, newSnapshot));
        db_1.default.push(".snapshot", Object.assign({}, newSnapshot));
        db_1.default.save();
    }
    else {
        db_1.default.push(".counter", counter + 1);
        db_1.default.save();
    }
    console.log(`${dirId} requested`);
    const alreadyExistingRate = db_1.default.getData(".allConvertedRates")[dirId];
    if (alreadyExistingRate)
        return alreadyExistingRate;
    const allConvertedRates = await (0, getAllRates_1.default)();
    return allConvertedRates && allConvertedRates[dirId];
}
exports.default = handleDirRequest;
//# sourceMappingURL=handleDirRequest.js.map