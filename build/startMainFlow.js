"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const Tops_1 = __importDefault(require("./rates/Tops"));
const startMainFlow = () => {
    const firstTimeExchangers = db_1.default.getData(".exchangers");
    const { restartRatesHandlerIn } = initTimeouts(firstTimeExchangers);
    console.log(`\u001b[1;34m Анализ курсов начнется через ${restartRatesHandlerIn / 1000}c`);
    db_1.default.push(".looped", {});
    loopNewExchangers(firstTimeExchangers); // первичный
    let globalLoopsDone = 1;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        const exchangers = db_1.default.getData(".exchangers");
        globalLoopsDone += 1;
        if (globalLoopsDone % 5 === 0) {
            console.log("Suspended -> Active");
            yield (0, statusChange_1.default)("suspended", "active");
            yield (0, initialLoader_1.default)();
            (0, DirsExistHandler_1.default)();
        }
        //initTimeouts(exchangers);
        loopNewExchangers(exchangers);
        calculateTops();
        dbRates_1.default.save();
        db_1.default.save();
    }), restartRatesHandlerIn);
};
const loopNewExchangers = (exchangers) => {
    // лупим только те, которые еще не в лупе
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
    // время паузы между стартом запросов захардкожено как 300мс, все прочее автоматом подстраивается
    const gap = 300;
    let leftToLoop = newIDLinkPairs.length;
    newIDLinkPairs.map(({ exchangerId, rates_link }, index) => __awaiter(void 0, void 0, void 0, function* () {
        yield new Promise((resolve) => setTimeout(resolve, index * gap));
        // промежутки во времени между ∞ циклами четверть секунды
        leftToLoop -= 1;
        console.log(`\u001b[1;34m ⓘ ${exchangerId} : Цикл опроса запущен, осталось запустить ${leftToLoop}`);
        db_1.default.push(`.looped.${exchangerId}`, true);
        const loop = new Loop_1.default(exchangerId, rates_link);
        loop.run();
    }));
};
const calculateTops = () => {
    console.log(`\u001b[1;34m Поиск лучших курсов...`);
    const allDirsRates = dbRates_1.default.getData(".allDirsRates");
    const allDirsTops = (0, Tops_1.default)(allDirsRates);
    dbRates_1.default.push(".allDirsTops", allDirsTops);
};
const initTimeouts = (exchangers) => {
    const exchangersLength = Object.keys(exchangers).length;
    // для 100 обменников
    const getRatesIn = exchangersLength * 300 > 12000 ? exchangersLength * 300 : 12000;
    // опрос первого в очереди обменника начнется через 30 сек, минимально 12 секунд
    const expireIn = getRatesIn - 2000;
    // и ожидание ответа первого прекратится через 28 сек
    const restartRatesHandlerIn = getRatesIn + 8000;
    db_1.default.push(".timeouts", {
        getRatesIn,
        expireIn,
        restartRatesHandlerIn,
    });
    return { getRatesIn, expireIn, restartRatesHandlerIn };
    // каждые 38 сек будет производиться обработка урожая
};
exports.default = startMainFlow;
