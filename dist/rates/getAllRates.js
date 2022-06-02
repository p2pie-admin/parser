"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const Loop_1 = __importDefault(require("./Loop"));
const runDelayedRatesHandler_1 = __importDefault(require("./runDelayedRatesHandler"));
const getAllRates = () => {
    const exchangers = db_1.default.getData('.exchangers');
    const idRateLinkPairs = Object.entries(exchangers).map(([exchangerId, exchangerData]) => ({ exchangerId, rates_link: exchangerData.rates_link }));
    const gap = 300;
    let leftToLoop = idRateLinkPairs.length;
    (0, runDelayedRatesHandler_1.default)();
    idRateLinkPairs.map(async ({ exchangerId, rates_link }, index) => {
        await new Promise(resolve => setTimeout(resolve, index * gap));
        leftToLoop -= 1;
        console.log(`\u001b[1;34m ⓘ ${exchangerId} : Цикл опроса запущен, осталось запустить ${leftToLoop}`);
        const loop = new Loop_1.default(exchangerId, rates_link);
        loop.run();
    });
};
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map