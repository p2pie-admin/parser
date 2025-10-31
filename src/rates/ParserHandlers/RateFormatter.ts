import { setData } from "../../utils/redis";

import { ICity } from "../../types";
import { IExchanger } from "../../types/exchanger";
import { IRateData } from "../../types/exchangerResp";
import { IRate, IGeneralData } from "../../types/rates";

import { sendExchangerWarning } from "../ErrorHandler";
import { transformLimit } from "../helper";
import { groupRatesDataCities } from "./CitiesHandler";
import { smallTTL } from "../../utils/settings";

type CityRates = Record<
  string,
  {
    rate: IRate;
    city: ICity;
  }
>;

type ExtractedRate = {
  dir: string;
  rate: IRate;
};

export default class RateFormatter {
  exchanger: IExchanger;
  generalData: IGeneralData;
  cities: ICity[];
  private allowedCodes: Set<string>;
  private altCodeToPrimary: Map<string, string>;
  private disabledDirs: Set<string>;

  constructor(
    exchanger: IExchanger,
    generalData: IGeneralData,
    cities: ICity[]
  ) {
    this.exchanger = exchanger;
    this.generalData = generalData;
    this.cities = cities;

    const allowedCodes = new Set<string>();
    const altMap = new Map<string, string>();

    (generalData.allPmCodesThatExist || []).forEach((code) => {
      const normalized = code?.toUpperCase();
      if (normalized) {
        allowedCodes.add(normalized);
      }
    });

    (generalData.alternativePmCodes || []).forEach(([primary, alternative]) => {
      const primaryCode = primary?.toUpperCase();
      const alternativeCode = alternative?.toUpperCase();
      if (primaryCode) {
        allowedCodes.add(primaryCode);
      }
      if (primaryCode && alternativeCode) {
        allowedCodes.add(alternativeCode);
        altMap.set(alternativeCode, primaryCode);
      }
    });

    this.allowedCodes = allowedCodes;
    this.altCodeToPrimary = altMap;

    const disabledDirs = new Set<string>();
    (generalData.dirsDisabled || "")
      .split(",")
      .map((dir) => dir.trim().toUpperCase())
      .filter(Boolean)
      .forEach((dir) => disabledDirs.add(dir));

    this.disabledDirs = disabledDirs;
  }

  formatAndMatchRatesWithDirs = async (rates: IRateData[]) => {
    const groupedRateData = await groupRatesDataCities(this.exchanger, rates);
    const updates: Promise<unknown>[] = [];

    for (const rateData of groupedRateData) {
      const extracted = this.createRate(rateData);
      if (!extracted) continue;

      updates.push(
        setData(
          `allDirtyRates:${extracted.dir}:${this.exchanger.id}`,
          extracted.rate,
          smallTTL
        )
      );
    }

    if (updates.length) {
      await Promise.allSettled(updates);
    }
  };

  private normalizeCode = (code?: string): string | null => {
    if (!code) return null;
    const upper = code.toUpperCase();
    if (!this.allowedCodes.has(upper)) return null;
    return this.altCodeToPrimary.get(upper) ?? upper;
  };

  private getNormalizedDirection = (
    rateData: IRateData
  ): { from: string; to: string } | null => {
    const rawFrom = rateData?.from?._text;
    const rawTo = rateData?.to?._text;
    const from = this.normalizeCode(rawFrom);
    const to = this.normalizeCode(rawTo);
    if (!from || !to) return null;

    const dir = `${from}_${to}`;
    if (this.disabledDirs.has(dir)) return null;

    return { from, to };
  };

  private createRate = (
    rateData: IRateData,
    includeCityRates = true
  ): ExtractedRate | null => {
    const normalizedDirection = this.getNormalizedDirection(rateData);
    if (!normalizedDirection) return null;

    const { from, to } = normalizedDirection;
    const dir = `${from}_${to}`;

    try {
      const { id, name, tag, logo, admin_rating, ref_link, rates_link } =
        this.exchanger;

      const inAmount = +rateData.in._text;
      const outAmount = +rateData.out._text;
      if (!Number.isFinite(inAmount) || !Number.isFinite(outAmount) || outAmount === 0) {
        return null;
      }

      const course = inAmount / outAmount;
      if (!Number.isFinite(course) || course <= 0) return null;

      const min = transformLimit(rateData.minamount._text, course, dir);
      const max = transformLimit(rateData.maxamount._text, course, dir);
      const reserve = transformLimit(
        `${rateData.amount._text} ${to}`,
        course,
        dir
      );

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
        last_time_updated: Date.now(),
      } as IRate;

      if (includeCityRates) {
        const cityRates = this.convertCityRates(rateData.cityRatesData);
        if (Object.keys(cityRates).length) {
          rate.cityRates = cityRates;
        }
      }

      return { dir, rate };
    } catch (err) {
      sendExchangerWarning(this.exchanger.id, dir, String(err));
      return null;
    }
  };

  private convertCityRates = (cityRatesData?: {
    [key: string]: IRateData;
  }): CityRates => {
    if (!cityRatesData) return {};
    return Object.entries(cityRatesData).reduce((res, [cityCode, rateData]) => {
      const city = this.cities.find(
        (c) =>
          c.codes[0] == cityCode.toUpperCase() ||
          c.codes?.[1] == cityCode.toUpperCase() ||
          c.codes?.[2] == cityCode.toUpperCase()
      );
      if (!city?.en_name) return res;

      const extracted = this.createRate(rateData, false);
      if (!extracted) return res;

      return {
        ...res,
        [city.en_name.toLowerCase()]: {
          rate: extracted.rate,
          city,
        },
      };
    }, {} as CityRates);
  };

  // Backward compatibility: preserve previous method signature if used elsewhere.
  extractRateFromRateData = (rateData: IRateData): IRate | undefined => {
    return this.createRate(rateData)?.rate;
  };
}
