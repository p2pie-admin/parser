import { setData } from "../../utils/redis";

import { ICity } from "../../types";
import { IExchanger } from "../../types/exchanger";
import { IRateData } from "../../types/exchangerResp";
import { IRate, IGeneralData } from "../../types/rates";

import { sendExchangerWarning } from "../ErrorHandler";
import { transformLimit } from "../helper";
import { groupRatesDataCities } from "./CitiesHandler";
import { smallTTL } from "../../utils/settings";

type CityRates = Record<string, IRate>;

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
  private cityLookup: Map<string, ICity>;

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
    const cityLookup = new Map<string, ICity>();

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
    this.cityLookup = cityLookup;

    cities.forEach((city) => {
      const primaryCode = city.codes?.[0]?.toUpperCase();
      if (primaryCode) {
        cityLookup.set(primaryCode, city);
      }
    });

    cities.forEach((city) => {
      (city.codes || [])
        .slice(1)
        .forEach((code) => {
          const normalized = code?.toUpperCase();
          if (normalized && !cityLookup.has(normalized)) {
            cityLookup.set(normalized, city);
          }
        });
    });

    const disabledDirs = new Set<string>();
    (generalData.dirsDisabled || "")
      .split(",")
      .map((dir) => dir.trim().toUpperCase())
      .filter(Boolean)
      .forEach((dir) => disabledDirs.add(dir));

    this.disabledDirs = disabledDirs;
  }

  formatAndMatchRatesWithDirs = async (rates: IRateData[]) => {
    const totalRates = Array.isArray(rates) ? rates.length : 0;
    this.exchanger.total_rates = totalRates;

    const filteredRates: IRateData[] = [];

    for (const rateData of rates) {
      const normalized = this.getNormalizedDirection(rateData);
      if (!normalized) continue;
      (rateData as any).__normalizedDirection = normalized;
      filteredRates.push(rateData);
    }

    if (!filteredRates.length) return;

    const groupedRateData = await groupRatesDataCities(
      this.exchanger,
      filteredRates
    );
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
    const normalizedDirection =
      (rateData as any).__normalizedDirection ||
      this.getNormalizedDirection(rateData);
    if (!normalizedDirection) return null;

    const { from, to } = normalizedDirection;
    const dir = `${from}_${to}`;

    try {
      const {
        id,
        name,
        tag,
        logo,
        admin_rating,
        ref_link,
        rates_link,
        parameters,
        offices,
      } =
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
        parameters,
        offices,
        source_total_rates: this.exchanger.total_rates,
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
      const city = this.cityLookup.get(cityCode.toUpperCase());
      if (!city?.en_name) return res;

      const extracted = this.createRate(rateData, false);
      if (!extracted) return res;

      return {
        ...res,
        [city.en_name.toLowerCase()]: extracted.rate,
      };
    }, {} as CityRates);
  };

  // Backward compatibility: preserve previous method signature if used elsewhere.
  extractRateFromRateData = (rateData: IRateData): IRate | undefined => {
    return this.createRate(rateData)?.rate;
  };
}
