"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbRates_1 = __importDefault(require("../../dbRates"));
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
//       "tag": null,
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
const addDirsToDB = (uid, dirCodes, rateData) => {
    dirCodes.map((dirCode) => {
        // создаем новое направление если не существует
        const prevDirRatesExist = dbRates_1.default.exists(`.allDirsP2P.${dirCode}`);
        if (!prevDirRatesExist) {
            dbRates_1.default.push(`.allDirsP2P.${dirCode}`, [rateData]);
            return;
        }
        // или добавляем в существующее
        const prevDirRates = dbRates_1.default.getData(`.allDirsP2P.${dirCode}`);
        dbRates_1.default.push(`.allDirsP2P.${dirCode}`, [...prevDirRates, rateData]);
    });
};
const getDirCode = (give, get) => {
    return `${give.code.toUpperCase()}_${get.code.toUpperCase()}`;
};
const convertLimit = (limit, rate, gbtg) => {
    return gbtg
        ? { give: +limit, get: +limit / +rate }
        : { give: +limit / +rate, get: +limit };
};
// const flatten = (a: any[]): any =>
//   Array.isArray(a) ? [].concat(...a.map(flatten)) : a;
exports.default = (order) => {
    const { status, dirs, uid, name, locations, regulationCodes } = order;
    // фильтруем пустые и заблокированные
    if (!(dirs === null || dirs === void 0 ? void 0 : dirs.length) || status !== "active")
        return;
    dirs.map((dir) => {
        const { give, get, usersRate, defRate: defRate, giveBiggerValueThanGet, } = dir;
        if (!(give === null || give === void 0 ? void 0 : give.length) || !(get === null || get === void 0 ? void 0 : get.length) || !usersRate || !defRate)
            return;
        const { min, max, rate: customRate } = usersRate;
        const p2pRatio = (regulationCodes === null || regulationCodes === void 0 ? void 0 : regulationCodes.follow_market)
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
            tag: "p2p",
            cities: locations === null || locations === void 0 ? void 0 : locations.map((l) => l.code).join("/"),
            // перечисляем только включенные параметры, потом возьмем их описание из Exchanger Parameters
            parameterCodes: Object.entries(regulationCodes || {}).reduce((res, [code, isActive]) => (isActive ? [...res, code] : res), []),
        };
        const gives = give.map((give) => give);
        const gets = get.map((get) => get);
        const dirCodes = gives.map((give) => gets.map((get) => getDirCode(give, get))[0]);
        addDirsToDB(uid, dirCodes, rateData);
    });
    return;
};
// "BTC_CASHUSD": {
//           "858": {
//               "name": "InternetMoney",
//               "admin_rating": null,
//               "tag": null,
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
