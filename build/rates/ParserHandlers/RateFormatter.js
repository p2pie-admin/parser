"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../../redis");
const ErrorHandler_1 = require("../ErrorHandler");
const helper_1 = require("../helper");
const CitiesHandler_1 = require("./CitiesHandler");
class RateFormatter {
    constructor(exchanger, generalData, cities) {
        this.formatAndMatchRatesWithDirs = async (rates) => {
            const groupedRateData = (0, CitiesHandler_1.groupRatesDataCities)(this.exchanger, rates);
            groupedRateData.map((rateData) => {
                let [from, to] = [
                    rateData?.from?._text?.toUpperCase(),
                    rateData?.to?._text?.toUpperCase(),
                ];
                const dir = `${from}_${to}`;
                const rate = this.extractRateFromRateData(rateData);
                rate && (0, redis_1.setData)(`allDirRates:${dir}:${this.exchanger.id}`, rate);
                // чистим ошибки если курсы есть
                if (this.exchanger.error)
                    (0, redis_1.setData)(`exchangers:${this.exchanger.id}:error`, {});
            });
        };
        this.extractRateFromRateData = (rateData) => {
            let [from, to] = [
                rateData?.from?._text?.toUpperCase(),
                rateData?.to?._text?.toUpperCase(),
            ];
            const dir = `${from}_${to}`;
            try {
                const { allPmCodesThatExist, alternativePmCodes, dirsDisabled } = this.generalData;
                const { id, name, tag, logo, admin_rating, ref_link, rates_link } = this.exchanger;
                const codes = [
                    ...allPmCodesThatExist,
                    ...alternativePmCodes.map((c) => c[1]),
                ];
                const fromIsAlt = alternativePmCodes.find((code) => code[1] == from);
                const toIsAlt = alternativePmCodes.find((code) => code[1] == to);
                if (fromIsAlt)
                    from = fromIsAlt[0];
                if (toIsAlt)
                    to = toIsAlt[0];
                // если хоть одна платежка в dir не из cms, скипаем
                if (!codes.find((code) => code === from) ||
                    !codes.find((code) => code === to))
                    return;
                // если запрещенные направления, тоже скипаем
                if (dirsDisabled &&
                    dirsDisabled
                        .replace(/ /g, "")
                        .split(",")
                        .find((dirDisabled) => dirDisabled.toUpperCase() === dir))
                    return;
                const course = +rateData.in._text / +rateData.out._text;
                const min = (0, helper_1.transformLimit)(rateData.minamount._text, +course, dir);
                const max = (0, helper_1.transformLimit)(rateData.maxamount._text, +course, dir);
                const reserve = (0, helper_1.transformLimit)(`${rateData.amount._text} ${dir.split("_")[1]}`, +course, dir);
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
                        ? { parameterCodes: rateData.param._text.split(", ") || [] }
                        : {}),
                    ref_link: ref_link ||
                        rates_link
                            .replace("https://", "___")
                            .split("/")[0]
                            .replace("___", "https://")
                            .replace("api.", ""),
                    cityRates: this.convertCityRates(rateData.cityRatesData),
                    last_time_updated: Date.now(),
                };
                return rate;
            }
            catch (err) {
                // не добавляем ворнинги если уже есть
                !this.exchanger.warnings?.length &&
                    (0, ErrorHandler_1.sendExchangerWarning)(this.exchanger.id, dir, err + "");
                return;
            }
        };
        this.convertCityRates = (cityRatesData) => {
            if (!cityRatesData)
                return {};
            return Object.entries(cityRatesData).reduce((res, [cityCode, rateData]) => {
                const cityName = this.cities.find((c) => c.codes[0] == cityCode.toUpperCase() ||
                    c.codes?.[1] == cityCode.toUpperCase() ||
                    c.codes?.[2] == cityCode.toUpperCase())?.en_name;
                if (!cityName)
                    return res;
                return {
                    ...res,
                    [cityName.toLowerCase()]: this.extractRateFromRateData(rateData),
                };
            }, {});
        };
        this.exchanger = exchanger;
        this.generalData = generalData;
        this.cities = cities;
    }
}
exports.default = RateFormatter;
