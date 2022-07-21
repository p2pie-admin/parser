import { DB } from "../types";

const initialDB: DB = {
  looped: [],
  dirs: {},
  tops: [],
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
  warnings: {},
  left_to_parse: 0,
  possible_pm_codes: [],
};

export default initialDB;
