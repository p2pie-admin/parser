import { DB } from "../types";

const initialDB: DB = {
  dirs: {},
  parser_setting: {
    dirs_disabled: "",
    update_time_sec: 100,
    cities: {},
    filter_options: [],
    SD_applied_from: 8,
    SD_best_rates: 4,
    SD_worst_rates: 5,
  },
  exchangers: {
    active: [],
    suspended: []
  },
  errors: {},
  warnings: {},
  left_to_parse: 0,
  times_rates_requested: 1
};

export default initialDB;
