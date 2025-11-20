import { IOrder, IP2PDir } from "../../types/p2p";
import { IRate } from "../../types/rates";

import { IPm } from "../../types/selector";

// const createPossibleDirCodes = (dirs: IP2PDir[]) => {
//   dirs.reduce((res, dir) => {
//     if (dir.give?.length && dir.get?.length) {
//       const giveCodes = dir.give.map((give) => give.code.toUpperCase());
//       const getCodes = dir.get.map((get) => get.code.toUpperCase());
//       const dirs = giveCodes.map((giveCode) =>
//         getCodes.map((getCode) => `${giveCode}_${getCode}`)
//       );
//       return [...res];
//     }
//     return res;
//   }, []);
// };

// const P2PFormat = (order: IOrder) => {
//   const cities = order.locations?.map((l) => l.code?.toLowerCase);

//   const dirs = order.dirs;
//   // first convert [BTC] -> [CASHRUB, SBERRUB]  into BTC_CASHRUB, BTC_SBERRUB
//   if (!dirs?.length) return;

//   const dir = dirs[0].give?.[0].code.toUpperCase();

//   const convertedDirs = dirs.reduce((res: IP2PDir[], dir: IP2PDir) => {
//     return res;
//   }, []);
//   const dirRates = {} as DirRates;
// };

// export default P2PFormat;

// convert IOrder into :

// "BTC_CASHUSD": {
//   "858": {
//       "name": "InternetMoney",
//       "admin_rating": null,
//       "logo": null,
//       "course": 0.000034810501588982196,
//       "min": {
//           "give": 0.23,
//           "get": 6607.201548419999
//       },
//       "max": {
//           "give": 10.5,
//           "get": 301633.11416699993
//       },
//       "reserve": {
//           "give": 36.89913168432113,
//           "get": 1060000
//       },
//       "parameterCodes": [
//           "delivery"
//       ],
//       "cities": "ekb/kzn/krasn/msk/nsk/rsnd/spb/sochi/stam/dubai/ervn/alm/tbil/antl"
//   },

// const addDirsToDB = (dirCodes: string[], rateData: FullRate) => {
//   dirCodes.map((dirCode) => {
//     // создаем новое направление если не существует
//     const prevDirRatesExist = dbRates.exists(`.allDirsP2P.${dirCode}`);
//     if (!prevDirRatesExist) {
//       dbRates.push(`.allDirsP2P.${dirCode}`, [rateData]);
//       return;
//     }
//     // или добавляем в существующее
//     const prevDirRates = dbRates.getData(`.allDirsP2P.${dirCode}`);

//     dbRates.push(`.allDirsP2P.${dirCode}`, [...prevDirRates, rateData]);
//   });
// };

const getDirCode = (give: IPm, get: IPm) => {
  return `${give.code.toUpperCase()}_${get.code.toUpperCase()}`;
};

const convertLimit = (limit: string, rate: string, gbtg?: boolean) => {
  return gbtg
    ? { give: +limit, get: +limit / +rate }
    : { give: +limit / +rate, get: +limit };
};

// const flatten = (a: any[]): any =>
//   Array.isArray(a) ? [].concat(...a.map(flatten)) : a;

export default (order: IOrder) => {
  const { status, dirs, uid, name, locations, regulationCodes } = order;
  // фильтруем пустые и заблокированные
  if (!dirs?.length || status !== "active") return;

  dirs.map((dir) => {
    const {
      give,
      get,
      usersRate,
      defRate: defRate,
      giveBiggerValueThanGet,
    } = dir;

    if (!give?.length || !get?.length || !usersRate || !defRate) return;

    const { min, max, rate: customRate } = usersRate;
    const p2pRatio = regulationCodes?.follow_market
      ? +customRate[0] / +defRate
      : undefined;
    const gbtg = giveBiggerValueThanGet;
    const rateData = {
      exchangerId: uid,
      name: name || "",
      min: convertLimit(min[0], usersRate.rate[0], gbtg),
      max: convertLimit(max[0], usersRate.rate[0], gbtg),
      reserve: convertLimit(max[0], usersRate.rate[0], gbtg),
      course: gbtg ? +customRate[0] : 1 / +customRate[0],
      p2pRatio,
      logo: null,
      admin_rating: null,
      cities: locations?.map((l) => l.code).join("/"),
      // перечисляем только включенные параметры, потом возьмем их описание из Exchanger Parameters
      parameterCodes: Object.entries(regulationCodes || {}).reduce(
        (res: string[], [code, isActive]) => (isActive ? [...res, code] : res),
        []
      ),
    } as IRate;

    const gives = give.map((give) => give);
    const gets = get.map((get) => get);
    const dirCodes = gives.map(
      (give) => gets.map((get) => getDirCode(give, get))[0]
    );

    // addDirsToDB(dirCodes, rateData);
  });
  return;
};

// "BTC_CASHUSD": {
//           "858": {
//               "name": "InternetMoney",
//               "admin_rating": null,
//               "logo": null,
//               "course": 0.000034810501588982196,
//               "min": {
//                   "give": 0.23,
//                   "get": 6607.201548419999
//               },
//               "max": {
//                   "give": 10.5,
//                   "get": 301633.11416699993
//               },
//               "reserve": {
//                   "give": 36.89913168432113,
//                   "get": 1060000
//               },
//               "parameterCodes": [
//                   "delivery"
//               ],
//               "cities": "ekb/kzn/krasn/msk/nsk/rsnd/spb/sochi/stam/dubai/ervn/alm/tbil/antl"
//           },
