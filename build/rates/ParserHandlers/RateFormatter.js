"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const db_1 = __importDefault(require("../../db"));
const dbRates_1 = __importDefault(require("../../dbRates"));
class RateFormatter {
  constructor(exchangerId) {
    this.transformLimit = (limit, course, dir) => {
      // валюта минималки и максималки - это или валюта, указанная в поле или валюта отдаю
      // (если это просто число)
      const limitCurrencyFromXML = limit.split(" ")[1];
      const limitValue = parseFloat(limit);
      const [givePm, getPm] = dir.split("_");
      let [give, get] = [0, 0];
      [give, get] = !limitCurrencyFromXML
        ? [limitValue, limitValue / course] // если не указаны валюты в лимитах, то предполагаем, что это в валюте give
        : givePm.includes(limitCurrencyFromXML)
        ? [limitValue, limitValue / course]
        : getPm.includes(limitCurrencyFromXML)
        ? [limitValue * course, limitValue]
        : [0, 0];
      return { give, get };
    };
    this.formatAndMatchRatesWithDirs = (rates) => {
      // const cityCodes = db.getData(".parser_setting.cities") as {
      //   [key: string]: string[];
      // };
      const totalRatesAmount = rates ? rates.length : 0;
      const dirs_disabled = db_1.default.getData(
        ".parser_setting.dirs_disabled"
      );
      const all_pm_codes_that_exist = db_1.default.getData(
        ".all_pm_codes_that_exist"
      );
      let rateDataError = false;
      db_1.default.push(
        `.exchangers.${this.exchangerId}.total_rates`,
        totalRatesAmount
      );
      rates.map((rate) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
          const dir = `${rate.from._text.toUpperCase()}_${rate.to._text.toUpperCase()}`;
          // если хоть одна платежка в dir не из cms, скипаем
          if (
            !all_pm_codes_that_exist.find(
              (code) => code === rate.from._text.toUpperCase()
            ) ||
            !all_pm_codes_that_exist.find(
              (code) => code === rate.to._text.toUpperCase()
            )
          )
            return;
          // если запрещенные направления, тоже скипаем
          if (
            dirs_disabled &&
            dirs_disabled
              .split("\n")
              .find((dir_disabled) => dir_disabled.toUpperCase() === dir)
          )
            return;
          const course = +rate.in._text / +rate.out._text;
          const min = this.transformLimit(rate.minamount._text, +course, dir);
          const max = this.transformLimit(rate.maxamount._text, +course, dir);
          const reserve = this.transformLimit(
            `${rate.amount._text} ${dir.split("_")[1]}`,
            +course,
            dir
          );
          // const citiesHandler = new CitiesHandler();
          // let cities = {};
          // if (Object.keys(cityCodes).length && rate.city?._text) {
          //   const ru = citiesHandler.formatCities(0, rate.city?._text, cityCodes);
          //   const en = citiesHandler.formatCities(1, rate.city?._text, cityCodes);
          //   cities = {ru, en};
          // }
          const { name, tag, logo, admin_rating } = db_1.default.getData(
            `.exchangers.${this.exchangerId}`
          ); // сразу забираем данные обменника для отображения в таблице и свайпере
          const dirRate = Object.assign(
            Object.assign(
              Object.assign(
                Object.assign(
                  Object.assign(
                    Object.assign(
                      { name, admin_rating, tag, logo },
                      ((_a = rate.minfee) === null || _a === void 0
                        ? void 0
                        : _a._text) &&
                        parseFloat(
                          (_b = rate.minfee) === null || _b === void 0
                            ? void 0
                            : _b._text
                        ) > 0
                        ? { min_fee: rate.minfee._text }
                        : {}
                    ),
                    ((_c = rate.fromfee) === null || _c === void 0
                      ? void 0
                      : _c._text) &&
                      parseFloat(
                        (_d = rate.fromfee) === null || _d === void 0
                          ? void 0
                          : _d._text
                      ) > 0
                      ? { from_fee: rate.fromfee._text }
                      : {}
                  ),
                  ((_e = rate.tofee) === null || _e === void 0
                    ? void 0
                    : _e._text) &&
                    parseFloat(
                      (_f = rate.tofee) === null || _f === void 0
                        ? void 0
                        : _f._text
                    ) > 0
                    ? { to_fee: rate.tofee._text }
                    : {}
                ),
                {
                  course,
                  min,
                  max: max.give > reserve.give ? reserve : max,
                  reserve,
                }
              ),
              ((_g = rate.param) === null || _g === void 0 ? void 0 : _g._text)
                ? { parameterCodes: rate.param._text.split(", ") || [] }
                : {}
            ),
            {
              cities:
                (_h = rate.city) === null || _h === void 0 ? void 0 : _h._text,
            }
          );
          dbRates_1.default.push(
            `.allDirsRates.${dir}.${this.exchangerId}`,
            dirRate
          ); // as ConvertedDirRates)
        } catch (err) {
          rateDataError = true;
        }
      });
      if (rateDataError) {
        const errorHandler = new ErrorHandler_1.default(this.exchangerId);
        errorHandler.saveError(
          "data-error",
          "Данные курсов частично отсутствуют или имеют некорректный формат"
        );
      }
    };
    this.checkForErrors = (exchangerResponse) => {
      var _a, _b, _c;
      const errorHandler = new ErrorHandler_1.default(this.exchangerId);
      if (!exchangerResponse) {
        errorHandler.saveError("404");
        return false;
      }
      if (exchangerResponse.error) {
        errorHandler.saveError(
          "exchanger-custom-error",
          (_a =
            exchangerResponse === null || exchangerResponse === void 0
              ? void 0
              : exchangerResponse.error) === null || _a === void 0
            ? void 0
            : _a._text
        );
        return false;
      }
      if (
        !((_c =
          (_b = exchangerResponse.rates) === null || _b === void 0
            ? void 0
            : _b.item) === null || _c === void 0
          ? void 0
          : _c.length)
      ) {
        errorHandler.saveError("no-rates");
        return false;
      }
      return true;
    };
    this.exchangerId = exchangerId;
  }
}
exports.default = RateFormatter;
