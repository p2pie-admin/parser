"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./db"));
const dbRates_1 = __importDefault(require("./dbRates"));
const statusChange_1 = __importDefault(require("./statusChange"));
const initialLoader_1 = __importDefault(require("./initialLoader"));
const Loop_1 = __importDefault(require("./rates/ParserHandlers/Loop"));
const DirsExistHandler_1 = __importDefault(require("./rates/ParserHandlers/DirsExistHandler"));
const process_1 = __importDefault(require("process"));
const Tops_1 = __importDefault(require("./rates/Tops"));
const startMainFlow = () => {
    const firstTimeExchangers = db_1.default.getData(".exchangers");
    const { restartRatesHandlerIn } = initTimeouts(firstTimeExchangers);
    console.log(`\u001b[1;34m Анализ курсов начнется через ${restartRatesHandlerIn / 1000}c`);
    db_1.default.push(".looped", {});
    loopNewExchangers(firstTimeExchangers);
    let globalLoopsDone = 1;
    setInterval(async () => {
        const exchangers = db_1.default.getData(".exchangers");
        globalLoopsDone += 1;
        if (globalLoopsDone % 5 === 0) {
            console.log("Suspended -> Active");
            await (0, statusChange_1.default)("suspended", "active");
            await (0, initialLoader_1.default)();
            (0, DirsExistHandler_1.default)();
        }
        loopNewExchangers(exchangers);
        calculateTops();
        for (const [key, value] of Object.entries(process_1.default.memoryUsage())) {
            console.log(`Memory usage by ${key}, ${value / 1000000}MB `);
        }
        dbRates_1.default.save();
        db_1.default.save();
    }, restartRatesHandlerIn);
};
const loopNewExchangers = (exchangers) => {
    const newIDLinkPairs = Object.entries(exchangers).reduce((pairs, [exchangerId, exchangerData]) => {
        if (db_1.default.exists(`.looped.${exchangerId}`) &&
            db_1.default.getData(`.looped.${exchangerId}`))
            return pairs;
        return [
            ...pairs,
            {
                exchangerId,
                rates_link: exchangerData.rates_link,
            },
        ];
    }, []);
    const gap = 300;
    let leftToLoop = newIDLinkPairs.length;
    newIDLinkPairs.map(async ({ exchangerId, rates_link }, index) => {
        await new Promise((resolve) => setTimeout(resolve, index * gap));
        leftToLoop -= 1;
        console.log(`\u001b[1;34m ⓘ ${exchangerId} : Цикл опроса запущен, осталось запустить ${leftToLoop}`);
        db_1.default.push(`.looped.${exchangerId}`, true);
        const loop = new Loop_1.default(exchangerId, rates_link);
        loop.run();
    });
};
const calculateTops = () => {
    console.log(`\u001b[1;34m Поиск лучших курсов...`);
    const allDirsRates = dbRates_1.default.getData(".allDirsRates");
    const allDirsTops = (0, Tops_1.default)(allDirsRates);
    dbRates_1.default.push(".allDirsTops", allDirsTops);
};
const initTimeouts = (exchangers) => {
    const exchangersLength = Object.keys(exchangers).length;
    const pauseBetweenLoops = db_1.default.getData(".parser_setting.pause_between_loops");
    let getRatesIn = exchangersLength * 300 > 12000 ? exchangersLength * 300 : 12000;
    getRatesIn += +pauseBetweenLoops * 1000;
    const expireIn = getRatesIn - 2000;
    const restartRatesHandlerIn = getRatesIn + 8000;
    db_1.default.push(".timeouts", {
        getRatesIn,
        expireIn,
        restartRatesHandlerIn,
    });
    return { getRatesIn, expireIn, restartRatesHandlerIn };
};
exports.default = startMainFlow;
//# sourceMappingURL=startMainFlow.js.map