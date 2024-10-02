import { RateData, ExchangerResponse } from "../../types/exchangerResp";
import { Rate, Limit } from "../../types/rates";
import ErrorHandler from "./ErrorHandler";

import db from "../../db";
import dbRates from "../../dbRates";

export default class RateFormatter {
  exchangerId: string;

  constructor(exchangerId: string) {
    this.exchangerId = exchangerId;
  }

  transformLimit = (limit: string, course: number, dir: string): Limit => {
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

  formatAndMatchRatesWithDirs = (rates: RateData[]): void => {
    // const cityCodes = await db.getData(".parser_setting.cities") as {
    //   [key: string]: string[];
    // };
    const totalRatesAmount = rates ? rates.length : 0;
    await db.push(
      `.exchangers.${this.exchangerId}.total_rates`,
      totalRatesAmount
    );
    const dirs_disabled = (await db.getData(
      ".parser_setting.dirs_disabled"
    )) as string;
    const all_pm_codes_that_exist = (await db.getData(
      ".all_pm_codes_that_exist"
    )) as string[];
    const alternative_pm_codes = (await db.getData(
      ".alternative_pm_codes"
    )) as string[][];
    const codes = [
      ...all_pm_codes_that_exist,
      ...alternative_pm_codes.map((c) => c[1]),
    ];
    let rateDataError = false;

    rates.map((rate) => {
      try {
        let [from, to] = [
          rate.from._text.toUpperCase(),
          rate.to._text.toUpperCase(),
        ];
        const fromIsAlt = alternative_pm_codes.find((code) => code[1] == from);
        const toIsAlt = alternative_pm_codes.find((code) => code[1] == to);

        if (fromIsAlt) from = fromIsAlt[0];
        if (toIsAlt) to = toIsAlt[0];
        const dir = `${from}_${to}`;
        // если хоть одна платежка в dir не из cms, скипаем
        if (
          !codes.find((code) => code === from) ||
          !codes.find((code) => code === to)
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

        const { name, tag, logo, admin_rating, ref_link, rates_link } =
          await db.getData(`.exchangers.${this.exchangerId}`); // сразу забираем данные обменника для отображения в таблице и свайпере
        const dirRate = {
          name,
          admin_rating,
          tag,
          logo,
          ...(rate.minfee?._text && parseFloat(rate.minfee?._text) > 0
            ? { min_fee: rate.minfee._text }
            : {}),
          ...(rate.fromfee?._text && parseFloat(rate.fromfee?._text) > 0
            ? { from_fee: rate.fromfee._text }
            : {}),
          ...(rate.tofee?._text && parseFloat(rate.tofee?._text) > 0
            ? { to_fee: rate.tofee._text }
            : {}),
          course,
          min,
          max: max.give > reserve.give ? reserve : max,
          reserve,
          ...(rate.param?._text
            ? { parameterCodes: rate.param._text.split(", ") || [] }
            : {}),
          cities: rate.city?._text,
          ref_link:
            ref_link ||
            rates_link
              .replace("https://", "___")
              .split("/")[0]
              .replace("___", "https://"),
          last_time_updated: Date.now(),
        } as Rate;
        dbRates.push(`.allDirsRates.${dir}.${this.exchangerId}`, dirRate); // as ConvertedDirRates)
      } catch (err) {
        rateDataError = true;
      }
    });
    if (rateDataError) {
      const errorHandler = new ErrorHandler(this.exchangerId);
      errorHandler.sendError(
        "data-error",
        "Данные курсов частично отсутствуют или имеют некорректный формат"
      );
    }
  };

  checkForErrors = (exchangerResponse: ExchangerResponse | null): boolean => {
    const errorHandler = new ErrorHandler(this.exchangerId);

    if (!exchangerResponse) {
      errorHandler.sendError("404");
      return false;
    }
    if (exchangerResponse.error) {
      errorHandler.sendError(
        "exchanger-custom-error",
        exchangerResponse?.error?._text
      );
      return false;
    }
    if (!exchangerResponse.rates?.item?.length) {
      errorHandler.sendError("no-rates");
      return false;
    }
    return true;
  };
}
