import { Rate } from "../../types";
import db from "../../db";

const [givePm] = db.getData(".lastDir").split("_");

const transformRateStringsToRates = (rateStrings: string[]): Rate[] => {
  let ratesValues = rateStrings.map((rs) => rs.split(";"));

  const isCash = db.getData(".lastDir").includes("CASH");
  if (isCash) ratesValues = groupCities(ratesValues);

  return ratesValues.reduce((rates: Rate[], rateValues: string[]) => {
    const rate = formatRate(rateValues);
    const verifiedRate = verifyRate(rate);
    verifiedRate ? rates.push(verifiedRate) : addToProblematic(rateValues); // pushed only if verified
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

const formatRate = (rateValues: string[]): Rate => {
  const [
    id,
    name,
    course,
    reserve,
    _,
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

  const [give, get] = extractAmountsFromCourse(+course, from_fee, to_fee);

  const rate = {
    id: +id,
    name,
    give,
    get,
    from_fee,
    to_fee,
    course: +course,
    reserve: +reserve,
    min_amount: min_amount.includes(givePm) ? parseFloat(min_amount) : 0,
    max_amount: max_amount.includes(givePm) ? parseFloat(max_amount) : 0,
    paramIds,
    cities: formatCities(cities),
  };
  // города можно посомтреть тут https://www.bestchange.ru/wiki/rates.html
  return rate;
};

const extractAmountsFromCourse = (
  course: number,
  from_fee: string,
  to_fee: string
): [number, number] => {
  const feeGive = calculateFeeGive(from_fee, to_fee, course);
  const feeGet = calculateFeeGet(from_fee, to_fee, course);
  const [give, get] =
    course < 1 ? [1, feeGet(1 / course)] : [feeGive(course), 1];
  return [roundNumber(give), roundNumber(get)];
};

const calculateFeeGive = (from_fee: string, to_fee: string, course: number) => (
  amount: number
) => {
  // course = GET/GIVE
  let res = amount;
  for (let fee of [from_fee, to_fee]) {
    if (fee.includes("%") && parseFloat(fee)) {
      res = res * (1 + parseFloat(fee) / 100);
    } else if (fee !== "0") {
      res = fee.includes(givePm)
        ? res + parseFloat(fee) // currency is GIVE
        : res + parseFloat(fee) * course; // currency is GET transfered in GIVE
    }
  }
  return res;
};

const calculateFeeGet = (from_fee: string, to_fee: string, course: number) => (
  amount: number
) => {
  // course = GET/GIVE
  let res = amount;
  for (let fee of [from_fee, to_fee]) {
    if (fee.includes("%") && parseFloat(fee)) {
      res = res * (1 - parseFloat(fee) / 100);
    } else if (fee !== "0") {
      res = fee.includes(givePm)
        ? res - parseFloat(fee) / course // currency is GIVE
        : res - parseFloat(fee); // currency is GIVE transfered in GET
    }
  }
  return res;
};

const roundNumber = (num: number) => {
  const thousandsPart = num / 10000;
  const signsAfterPoint = Math.floor(Math.log10(thousandsPart));

  if (signsAfterPoint >= 0) {
    return +num.toFixed(0);
  }
  return +num.toFixed(-signsAfterPoint);
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

const verifyRate = (rate: Rate): Rate | null => {
  const { name, reserve, min_amount, max_amount } = rate;
  const targetViolations =
    name.length > 20 ||
    name.length < 3 ||
    reserve < min_amount ||
    min_amount > max_amount;
  const generalViolations = Object.values(rate).find(
    (val) => val === NaN || val === 0
  );
  return max_amount !== 0 && (targetViolations || generalViolations)
    ? null
    : rate;
};

const addToProblematic = (rateValues: string[]) => {
  const dir = db.getData(".lastDir");
  const exchangerName = rateValues[1].replace(".", "_");
  const problematicRateExists = db.exists(
    `.problematicRates.${dir}.${exchangerName}`
  );
  if (!problematicRateExists)
    db.push(
      `.problematicRates.${dir}.${exchangerName}`,
      formatRate(rateValues)
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
