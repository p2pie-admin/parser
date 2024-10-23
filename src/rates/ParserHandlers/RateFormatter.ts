import { mylog } from "../../helper";
import { getData, setData } from "../../redis";
import { ICity } from "../../types";
import { IExchanger, IRateWarning } from "../../types/exchanger";
import { IRateData } from "../../types/exchangerResp";
import { IRate, IGeneralData } from "../../types/rates";

import { sendExchangerError, sendExchangerWarnings } from "../ErrorHandler";
import { transformLimit } from "../helper";
import { groupRatesDataCities } from "./CitiesHandler";

export default class RateFormatter {
  exchanger: IExchanger;
  generalData: IGeneralData;

  constructor(exchanger: IExchanger, generalData: IGeneralData) {
    this.exchanger = exchanger;
    this.generalData = generalData;
  }

  formatAndMatchRatesWithDirs = async (rates: IRateData[]) => {
    // const cityCodes = await db.getData(".parser_setting.cities") as {
    //   [key: string]: string[];
    // };
    const { allPmCodesThatExist, alternativePmCodes, dirsDisabled } =
      this.generalData;
    const { id, name, tag, logo, admin_rating, ref_link, rates_link } =
      this.exchanger;

    const codes = [
      ...allPmCodesThatExist,
      ...alternativePmCodes.map((c) => c[1]),
    ];

    const groupedRates = groupRatesDataCities(this.exchanger, rates);

    groupedRates.map((rate) => {
      let [from, to] = [
        rate?.from?._text?.toUpperCase(),
        rate?.to?._text?.toUpperCase(),
      ];
      const dir = `${from}_${to}`;

      try {
        const fromIsAlt = alternativePmCodes.find((code) => code[1] == from);
        const toIsAlt = alternativePmCodes.find((code) => code[1] == to);

        if (fromIsAlt) from = fromIsAlt[0];
        if (toIsAlt) to = toIsAlt[0];

        // если хоть одна платежка в dir не из cms, скипаем
        if (
          !codes.find((code) => code === from) ||
          !codes.find((code) => code === to)
        )
          return;

        // если запрещенные направления, тоже скипаем
        if (
          dirsDisabled &&
          dirsDisabled
            .replace(/ /g, "")
            .split(",")
            .find((dirDisabled) => dirDisabled.toUpperCase() === dir)
        )
          return;

        const course = +rate.in._text / +rate.out._text;
        const min = transformLimit(rate.minamount._text, +course, dir);
        const max = transformLimit(rate.maxamount._text, +course, dir);
        const reserve = transformLimit(
          `${rate.amount._text} ${dir.split("_")[1]}`,
          +course,
          dir
        );

        // сразу забираем данные обменника для отображения в таблице и свайпере
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
          ref_link:
            ref_link ||
            rates_link
              .replace("https://", "___")
              .split("/")[0]
              .replace("___", "https://"),
          cityRates: this.convertCityRates(rate.cityRatesData),
          last_time_updated: Date.now(),
        } as IRate;
        setData(`allDirRates:${dir}:${id}`, dirRate);
        if (this.exchanger.error) setData(`exchangers:${id}:error`, {});
        //dbRates.push(`.allDirsRates.${dir}.${this.exchangerId}`, dirRate); // as ConvertedDirRates)
      } catch (err) {
        // не добавляем ворнинги если уже есть
        !this.exchanger.warnings?.length &&
          sendExchangerWarnings(this.exchanger, {
            dir,
            autoMessage: err + "",
          });
      }
    });
  };

  convertCityRates = (cityRatesData?: {
    [key: string]: IRateData;
  }): { [key: string]: { rate: IRate; city: ICity } } => {
    if (!cityRatesData) return {};
    return Object.entries(cityRatesData).reduce((res, [cityCode, rateData]) => {
      return { ...res, [cityCode]: { rate: rateData, city: cityCode } };
    }, {});
  };
}
