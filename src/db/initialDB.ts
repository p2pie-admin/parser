import { DB } from "../types";

const initialDB: DB = {
  jwt: "",
  looped: {},
  timeouts: {
    getRatesIn: 20_000,
    expireIn: 18_000,
    restartRatesHandlerIn: 22_000,
  },
  dirs: {},
  topCodes: [],
  parser_setting: {
    dirs_disabled: "",
    cities: {},
    filter_options: "",
    SD_applied_from: 8,
    SD_best_rates: 4,
    SD_worst_rates: 5,
  },
  exchangers: {},
  errors: {},
  possible_pm_codes: [],
  possible_pairs: {},
};

export default initialDB;
