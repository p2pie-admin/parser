"use strict";
// export const handleDirRequest = async (
//   send: Function,
//   dirId: string,
//   type: string
// ) => {
//   const dirTopsExist = await dbRates.exists(`.allDirsTops.${dirId}`);
//   const dirRatesExist = await dbRates.exists(`.allDirsRates.${dirId}`);
//   const dirP2PExist = await dbRates.exists(`.allDirsP2P.${dirId}`);
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMemoryUsage = exports.menu = exports.mylog = void 0;
const process_1 = require("process");
//   switch (type) {
//     case "all":
//       send(dbRates.getData(`.allDirsRates.${dirId}`));
//       break;
//     case "p2p":
//       dirP2PExist ? send(dbRates.getData(`.allDirsP2P.${dirId}`)) : send([]);
//       break;
//     case "tops":
//       dirTopsExist ? send(dbRates.getData(`.allDirsTops.${dirId}`)) : send([]);
//       break;
//     case "tops+p2p":
//       if (!dirP2PExist && !dirTopsExist) send([]);
//       const dirP2P = dirP2PExist
//         ? ((await dbRates.getData(`.allDirsP2P.${dirId}`)) as FullRate[])
//         : [];
//       const dirTops = dirTopsExist
//         ? ((await dbRates.getData(`.allDirsTops.${dirId}`)) as FullRate[])
//         : [];
//       send([...dirTops, ...dirP2P]);
//       break;
//     default:
//       send("Try this slug: /dir=BTC_SBERRUB/type=tops+p2p");
//       break;
//   }
// };
const mylog = (message, color = "info") => {
    const colors = {
        error: "📕 \u001b[1;31m",
        success: "📗 \u001b[1;32m",
        warning: "📙 \u001b[1;33m",
        info: "📘 \u001b[1;34m",
        hidden: "📓 \u001b[1;30m",
        important: "📔 \u001b[38;5;226m",
    };
    console.log(`${colors[color]} ${message}`);
};
exports.mylog = mylog;
exports.menu = `Примеры запросов:
\nОтфильтрованные курсы для BTC_CASHRUB: /dir=BTC_CASHRUB/type=tops
\nВсе курсы для BTC_CASHRUB: /dir=BTC_CASHRUB/type=all
\nВозможные пары для BTC: /possible_pairs/code=BTC
\nВсе возможные пары: /possible_pairs
\nСписок обменников: /exchangers
\nЗаранее посчитанные лучшие популярные курсы: /top
\nОшибки по обменникам: /errors
\nОшибки по направлениям: /dirs
\nВсе существующие курсы: /all_rates
\nПохожие курсы: /similar/dirs=BTC_SBERRUB,BTC_TCSBRUB,BTC_CASHRUB
`;
const logMemoryUsage = () => {
    const memoryData = (0, process_1.memoryUsage)();
    (0, exports.mylog)("Memory Usage:", "important");
    (0, exports.mylog)(`RSS: ${Math.round(memoryData.rss / 1024 / 1024)} MB`, "hidden");
    (0, exports.mylog)(`Heap Total: ${Math.round(memoryData.heapTotal / 1024 / 1024)} MB`, "hidden");
    (0, exports.mylog)(`Heap Used: ${Math.round(memoryData.heapUsed / 1024 / 1024)} MB`, "hidden");
    (0, exports.mylog)(`External: ${Math.round(memoryData.external / 1024 / 1024)} MB`, "hidden");
    if (memoryData.arrayBuffers) {
        (0, exports.mylog)(`Array Buffers: ${Math.round(memoryData.arrayBuffers / 1024 / 1024)} MB`, "hidden");
    }
};
exports.logMemoryUsage = logMemoryUsage;
