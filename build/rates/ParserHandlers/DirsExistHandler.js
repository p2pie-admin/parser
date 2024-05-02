"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
const dirsExistHandler = () => {
  const allDirsRates = dbRates_1.default.getData(".allDirsRates");
  const allPmCodesThatExist = db_1.default.getData(".all_pm_codes_that_exist");
  const possibleDirs = allPmCodesThatExist.reduce(
    (res, leftCode) => [
      ...res,
      ...allPmCodesThatExist.map((rightCode) => `${leftCode}_${rightCode}`),
    ],
    []
  );
  const possiblePairs = possibleDirs.reduce(
    // for showing on selector if dirs exist
    (possiblePairs, possibleDir) => {
      const dirRates = allDirsRates[possibleDir];
      if (!dirRates || !Object.keys(dirRates).length) return possiblePairs;
      const [leftPm, rightPm] = possibleDir.split("_");
      possiblePairs[leftPm] = possiblePairs[leftPm]
        ? [...possiblePairs[leftPm], rightPm]
        : [rightPm];
      return possiblePairs;
    },
    {}
  );
  db_1.default.push(".possible_pairs", possiblePairs);
  db_1.default.save();
  console.log(possiblePairs);
};
exports.default = dirsExistHandler;
