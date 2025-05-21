import { mylog } from "../../helper";
import { getData, setData } from "../../redis";

import { ICity } from "../../types";
import { IExchanger } from "../../types/exchanger";
import { IRateData } from "../../types/exchangerResp";
import { IRate, IGeneralData } from "../../types/rates";

import { sendExchangerError, sendExchangerWarning } from "../ErrorHandler";
import { transformLimit } from "../helper";
import { cityCodeToCity, groupRatesDataCities } from "./CitiesHandler";

export default class RateFormatter {
  exchanger: IExchanger;
  generalData: IGeneralData;
  cities: ICity[];

  constructor(
    exchanger: IExchanger,
    generalData: IGeneralData,
    cities: ICity[]
  ) {
    this.exchanger = exchanger;
    this.generalData = generalData;
    this.cities = cities;
  }

  formatAndMatchRatesWithDirs = async (rates: IRateData[]) => {
    const groupedRateData = groupRatesDataCities(this.exchanger, rates);

    groupedRateData.map((rateData) => {
      let [from, to] = [
        rateData?.from?._text?.toUpperCase(),
        rateData?.to?._text?.toUpperCase(),
      ];
      const dir = `${from}_${to}`;

      const rate = this.extractRateFromRateData(rateData);

      rate && setData(`allDirtyRates:${dir}:${this.exchanger.id}`, rate);
      // чистим ошибки если курсы есть
      if (this.exchanger.error)
        setData(`exchangers:${this.exchanger.id}:error`, {});
    });
  };

  extractRateFromRateData = (rateData: IRateData): IRate | undefined => {
    let [from, to] = [
      rateData?.from?._text?.toUpperCase(),
      rateData?.to?._text?.toUpperCase(),
    ];
    const dir = `${from}_${to}`;
    try {
      const { allPmCodesThatExist, alternativePmCodes, dirsDisabled } =
        this.generalData;
      const { id, name, tag, logo, admin_rating, ref_link, rates_link } =
        this.exchanger;

      const codes = [
        ...allPmCodesThatExist,
        ...alternativePmCodes.map((c) => c[1]),
      ];

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

      const course = +rateData.in._text / +rateData.out._text;
      const min = transformLimit(rateData.minamount._text, +course, dir);
      const max = transformLimit(rateData.maxamount._text, +course, dir);
      const reserve = transformLimit(
        `${rateData.amount._text} ${dir.split("_")[1]}`,
        +course,
        dir
      );

      // сразу забираем данные обменника для отображения в таблице и свайпере
      const rate = {
        exchangerId: id,
        name,
        admin_rating,
        tag,
        logo,
        ...(rateData.minfee?._text && parseFloat(rateData.minfee?._text) > 0
          ? { min_fee: rateData.minfee._text }
          : {}),
        ...(rateData.fromfee?._text && parseFloat(rateData.fromfee?._text) > 0
          ? { from_fee: rateData.fromfee._text }
          : {}),
        ...(rateData.tofee?._text && parseFloat(rateData.tofee?._text) > 0
          ? { to_fee: rateData.tofee._text }
          : {}),
        course,
        min,
        max: max.give > reserve.give ? reserve : max,
        reserve,
        ...(rateData.param?._text
          ? {
              parameterCodes:
                rateData.param._text
                  .toLowerCase()
                  .replace(/\s/g, "")
                  .split(",") || [],
            }
          : {}),
        ref_link:
          ref_link ||
          rates_link
            .replace("https://", "___")
            .split("/")[0]
            .replace("___", "https://")
            .replace("api.", ""),
        cityRates: this.convertCityRates(rateData.cityRatesData),
        last_time_updated: Date.now(),
      } as IRate;
      return rate;
    } catch (err) {
      // не добавляем ворнинги если уже есть
      !this.exchanger.warnings?.length &&
        sendExchangerWarning(this.exchanger.id, dir, err + "");
      return;
    }
  };

  convertCityRates = (cityRatesData?: {
    [key: string]: IRateData;
  }): { [key: string]: { rate: IRate; city: ICity } } => {
    if (!cityRatesData) return {};
    return Object.entries(cityRatesData).reduce((res, [cityCode, rateData]) => {
      const cityName = this.cities.find(
        (c) =>
          c.codes[0] == cityCode.toUpperCase() ||
          c.codes?.[1] == cityCode.toUpperCase() ||
          c.codes?.[2] == cityCode.toUpperCase()
      )?.en_name;
      if (!cityName) return res;
      return {
        ...res,
        [cityName.toLowerCase()]: this.extractRateFromRateData(rateData),
      };
    }, {});
  };
}
