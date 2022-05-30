"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const MainLoopLogic_1 = __importDefault(require("./MainLoopLogic"));
const Loop_1 = __importDefault(require("./Loop"));
const getAllRates = () => {
    const exchangers = db_1.default.getData('.exchangers');
    const idRateLinkPairs = Object.entries(exchangers).map(([exchangerId, exchangerData]) => ({ exchangerId, rates_link: exchangerData.rates_link }));
    const { timeout = 30000 } = db_1.default.getData(".parser_setting");
    const gap = +(timeout / idRateLinkPairs.length).toFixed(0);
    console.log(`will restart main loop in:  ${timeout / 1000 + 2}s with gap ${gap / 1000}s`);
    setInterval(() => {
        (0, MainLoopLogic_1.default)();
        console.log("MAIN LOOP RESTARTED");
    }, timeout + 2000);
    let leftToLoop = idRateLinkPairs.length;
    idRateLinkPairs.map(async ({ exchangerId, rates_link }, index) => {
        await new Promise(resolve => setTimeout(resolve, index * gap));
        leftToLoop -= 1;
        console.log(`Loop for ${exchangerId} was started, ${leftToLoop} left`);
        const loop = new Loop_1.default(exchangerId, rates_link);
        loop.run();
    });
};
exports.default = getAllRates;
//# sourceMappingURL=getAllRates.js.map