import { Rate, Limit, Exchanger } from "../../types";
import db from "../../db";
//import getRatesStatistics from "./getRatesStatistics";

const exchangers = db.getObject<Exchanger[]>(".exchangers");

const transformRateStringsToRates = (
  rateStrings: string[],
  dir: string
): Rate[] => {
  let manyRatesValues = rateStrings.map((rs) => rs.split(";"));
  const [givePmName, getPmName] = dir.split("_");
  const isCash = givePmName.startsWith("CASH") || getPmName.startsWith("CASH");
  if (isCash) manyRatesValues = groupCities(manyRatesValues);

  //db.push(".ratesStatistics", getRatesStatistics(manyRatesValues));

  return manyRatesValues.reduce((rates: Rate[], rateValues: string[]) => {
    const rate = formatRate(rateValues, dir);
    rates.push(rate);
    return rates;
  }, []);
};

const groupCities = (ratesValues: string[][]): string[][] => {
  return ratesValues.reduce((grouped: string[][], rateValues: string[]) => {
    const sameIndex = grouped.findIndex((rv) => rv[0] === rateValues[0]); // same exchanger index
    sameIndex === -1
      ? grouped.push(rateValues)
      : (grouped[sameIndex][10] =
          grouped[sameIndex][10] + "/" + rateValues[10]);
    return grouped;
  }, []);
  // turns this [[544, TestExch, ... , VLGD], [544, TestExch, ... , ARKH], [196, SomeTradex, ... , VORON]]
  // into this  [[544, TestExch, ... , VLGD/ARKH], [196, SomeTradex, ... , VORON]]
};

const formatRate = (rateValues: string[], dir: string): Rate => {
  const [
    id,
    name,
    course,
    reserve,
    min_fee,
    from_fee,
    to_fee,
    min_amount,
    max_amount,
    mask,
    cities,
  ] = rateValues;

  const binParams = [
    0b000000001,
    0b000000010,
    0b000000100,
    0b000001000,
    0b000010000,
    0b000100000,
    0b001000000,
    0b010000000,
    0b100000000,
  ];

  const paramIds = binParams.reduce(
    (res: number[], p): number[] =>
      p & +mask ? [...res, binParams.indexOf(p)] : res,
    []
  );

  const min = transformLimit(min_amount, +course, dir);
  const max = transformLimit(max_amount, +course, dir);
  const resv = transformLimit(`${reserve} ${dir.split("_")[1]}`, +course, dir);

  const rate = {
    id,
    course: +course,
    exchanger: findExchanger(name),
    min_fee,
    from_fee,
    to_fee,
    // min: min_amount,
    // max: max_amount,
    min_amount: min,
    max_amount: max.give > resv.give ? resv : max,
    reserve: resv,
    paramIds,
    cities: formatCities(cities),
  };
  // города можно посмoтреть тут https://www.bestchange.ru/wiki/rates.html
  return rate;
};

const transformLimit = (limit: string, course: number, dir: string): Limit => {
  const limitCur = limit.split(" ")[1];
  const limitValue = parseFloat(limit);
  const [givePm, getPm] = dir.split("_");
  const give = givePm.includes(limitCur)
    ? limitValue
    : getPm.includes(limitCur)
    ? limitValue * course
    : 0;
  const get = getPm.includes(limitCur)
    ? limitValue
    : givePm.includes(limitCur)
    ? limitValue / course
    : 0;
  return { give, get };
};

const formatCities = (cities: string) => {
  const cityList = db.getData(".preferences.cities");
  return cities
    .split("/")
    .reduce((accumulator: { [key: string]: string[] }, cityCode: string) => {
      let [city, country] = cityList[cityCode]
        ? cityList[cityCode].split(",")
        : [null, null];
      if (city && country) {
        country = country.replace(" ", "");
        accumulator[country] = accumulator[country]
          ? [...accumulator[country], city]
          : [city];
      }
      return accumulator;
    }, {});
};

const findExchanger = (name: string): Exchanger => {
  return (
    exchangers.find(
      (exch) =>
        exch.name.toLowerCase().replace(/ /g, "") ===
        name.toLowerCase().replace(/ /g, "")
    ) || { name, our_rating: 3 }
  );
};
// const sortByKey = (rates, { id, asc }) => {
//   const deepCloneOfNestedObject = JSON.parse(JSON.stringify(rates));
//   const sortFunction = id === "name" ? _stringSort : _numberSort;
//   const sorted = deepCloneOfNestedObject.sort(function (rate1, rate2) {
//     return sortFunction(rate1[id], rate2[id]);
//   });
//   return asc ? sorted.reverse() : sorted;
// };

// const findOptimal = (rates, top = 3) => {
//   return rates.reduce((top, rate) => {
//     const ratio = rate.course - lowestCourse;
//     return resObj;
//   }, {});
// };

// if (rateStrings) {
//   for (let rateString of rateStrings) {
//     const rate = rateString.split(";");
//     const sameExchanger = res.find((r) => r.id === Number(rate[0]));
//     if (sameExchanger) {
//       const index = res.indexOf(sameExchanger);
//       const city = _getCity(rate[10]);
//       const cities = city ? [...res[index].cities, city] : res[index].cities;
//       res[index] = { ...res[index], cities };
//     } else {
//       res = [...res, _createRate(rate)];
//     }
//   }
// }
// //const giveHigherThanGet = res[1]?.course > 1;
// // THE SMALLER COURSE THE BETTER
// return sortByKey(res, {
//   // course = get/give
//   id: "course",
//   asc: false, // asc - small to large
// });

export default transformRateStringsToRates;
